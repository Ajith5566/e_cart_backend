// controller/pageController.js — verified & fixed
const Page = require("../modal/pageSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const { archiveSlugIfChanged, archiveSlugChange } = require("../utils/slugHelper");
const slugify = require("slugify");
const { publicPath, removeFile } = require("../utils/filestorage");
// ➕ Add page
exports.addPage = async (req, res) => {
  try {
    const ogImageFiles = req.files?.["og_image"] || [];
    const twitterFiles = req.files?.["twitter_image"] || [];
  const ogImageUrl = ogImageFiles[0] ? publicPath("pages", ogImageFiles[0]) : "";
const twitterImageUrl = twitterFiles[0] ? publicPath("pages", twitterFiles[0]) : "";

    const { title, shortDescription, description, meta } = req.body;

    const parsedMeta = meta
      ? typeof meta === "string" ? JSON.parse(meta) : meta
      : {};

    // ✅ FIX: the slug the user chose in the SEO preview (meta.slug) wins;
    // fall back to slugifying the title. One source of truth.
    const slug = (parsedMeta.slug || slugify(title, { lower: true, strict: true, trim: true }))
      .toLowerCase()
      .trim();

    // duplicate check: current slugs AND archived slugs of other pages
    const existingPage = await Page.findOne({ slug });
    const slugInHistory = await SlugHistory.findOne({ old_slug: slug, entity_type: "page" });

    if (existingPage || slugInHistory) {
      return res.status(409).json({ message: "Page title already exist" });
    }

    const page = new Page({ title, slug, shortDescription, description });
    await page.save();

    if (Object.keys(parsedMeta).length > 0) {
      if (ogImageUrl) parsedMeta.og_image = ogImageUrl;
      if (twitterImageUrl) parsedMeta.twitter_image = twitterImageUrl;
      parsedMeta.slug = slug; // ✅ keep meta.slug in sync with Page.slug

      await Meta.findOneAndUpdate(
        { entity_type: "page", entity_id: page._id },
        { ...parsedMeta, entity_type: "page", entity_id: page._id },
        { new: true, upsert: true }
      );
    }

    res.status(201).json({ message: "Page created successfully", page });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Page creation failed" });
  }
};

// 📄 Get all pages (admin)
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 }).lean();

    const pageIds = pages.map((p) => p._id);

    const allMetas = await Meta.find({
      entity_type: "page",
      entity_id: { $in: pageIds },
    }).lean();

    const metaMap = allMetas.reduce((acc, meta) => {
      acc[meta.entity_id.toString()] = meta;
      return acc;
    }, {});

    const pagesWithMeta = pages.map((page) => ({
      ...page,
      meta: metaMap[page._id.toString()] || {},
    }));

    res.status(200).json(pagesWithMeta);
  } catch (err) {
    console.error("GET ALL PAGES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch pages" });
  }
};

// ✏️ Update page
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;

    const ogImageFiles = req.files?.["og_image"]      || [];
    const twitterFiles = req.files?.["twitter_image"] || [];

    // ✅ use publicPath — not .path
    const ogImageUrl      = ogImageFiles[0] ? publicPath("pages", ogImageFiles[0]) : "";
    const twitterImageUrl = twitterFiles[0] ? publicPath("pages", twitterFiles[0]) : "";

    const { title, shortDescription, description, meta } = req.body;

    const existingPage = await Page.findById(id);
    if (!existingPage) {
      return res.status(404).json({ message: "Page not found" });
    }

    const parsedMeta = meta
      ? typeof meta === "string" ? JSON.parse(meta) : meta
      : {};

      console.log( parsedMeta._id);
      

    const newSlug = (parsedMeta.slug || existingPage.slug).toLowerCase().trim();

    if (newSlug !== existingPage.slug) {
      const slugTaken = await Page.findOne({ slug: newSlug, _id: { $ne: id } });
      const slugInHistory = await SlugHistory.findOne({
        old_slug:    newSlug,
        entity_type: "page",
        entity_id:    parsedMeta._id
      });
       console.log( parsedMeta._id);
      if (slugTaken || slugInHistory) {
        return res.status(409).json({ message: "This slug is already in use" });
      }
      await archiveSlugChange("page",parsedMeta._id, newSlug);
    }

    // ✅ remove old images if replaced
    const existingMeta = await Meta.findOne({ entity_type: "page", entity_id: id });
    if (ogImageFiles[0]  && existingMeta?.og_image)      removeFile(existingMeta.og_image);
    if (twitterFiles[0]  && existingMeta?.twitter_image) removeFile(existingMeta.twitter_image);

    const page = await Page.findByIdAndUpdate(
      id,
      { $set: { title, slug: newSlug, shortDescription, description } },
      { new: true }
    );

    if (Object.keys(parsedMeta).length > 0) {
      if (ogImageUrl)      parsedMeta.og_image       = ogImageUrl;
      if (twitterImageUrl) parsedMeta.twitter_image  = twitterImageUrl;
      parsedMeta.slug = newSlug;

      await Meta.findOneAndUpdate(
        { entity_type: "page", entity_id: id },
        { $set: { ...parsedMeta, entity_type: "page", entity_id: id } },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({ message: "Page updated successfully", page });
  } catch (error) {
    console.error("UPDATE PAGE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

// 🗑️ Delete page
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ check before delete
    const page = await Page.findById(id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    if (page.isSystem) return res.status(403).json({ message: "System pages cannot be deleted" });

    await Page.findByIdAndDelete(id);
    await Meta.findOneAndDelete({ entity_type: "page", entity_id: id });
    await SlugHistory.deleteMany({ entity_type: "page", entity_id: id });

    res.status(200).json({ message: "Page deleted successfully" });
  } catch (error) {
    console.error("DELETE PAGE ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};

// 🔄 Toggle active
exports.togglePageStatus = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });

    // ✅ block toggle for system pages
    if (page.isSystem) return res.status(403).json({ message: "System page status cannot be changed" });

    page.isActive = !page.isActive;
    await page.save();

    res.status(200).json({
      message: page.isActive ? "Page enabled" : "Page disabled",
    });
  } catch (error) {
    console.error("TOGGLE PAGE ERROR:", error);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// 🌐 Get page by slug (public) — with history redirect
exports.getPageBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    // 1. current slug
    const page = await Page.findOne({ slug, isActive: true });

    if (page) {
      const meta = await Meta.findOne({ entity_type: "page", entity_id: page._id });
      return res.status(200).json({ page, meta: meta || {} });
    }

    // 2. ✅ FIX: fallback to slug history → redirect flag (same as products)
    const history = await SlugHistory.findOne({ old_slug: slug, entity_type: "page" });

    if (history) {
      const currentPage = await Page.findById(history.entity_id);
      if (currentPage && currentPage.slug) {
        return res.status(200).json({
          redirect: true,
          newSlug: currentPage.slug,
        });
      }
    }

    // 3. nothing
    return res.status(404).json({ message: "Page not found" });
  } catch (error) {
    console.error("GET PAGE BY SLUG ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔎 Get page by id (admin, edit form)
exports.getPageById = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await Page.findById(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    // ✅ FIX: was entity_type: "Page" (capital P) — matched NOTHING,
    // so the edit form never received meta and the slug prompt never fired
    const meta = await Meta.findOne({
      entity_type: "page",
      entity_id: id,
    });

    res.status(200).json({
      ...page.toObject(),
      meta: meta || {},
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch page" });
  }
};
// ============================================================
// BACKEND — bulk actions for pages
// ============================================================

// ---------- controller/page controller — ADD ----------
// (adjust the Page model import name to match your file)
/*
const Page = require("../modal/pageSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
*/

// ================= BULK STATUS (admin) =================
exports.bulkTogglePages = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "No pages selected" });
    if (typeof isActive !== "boolean")
      return res.status(400).json({ message: "isActive must be true or false" });

    const filter = {
      _id:      { $in: ids },
      isSystem: { $ne: true }, // ✅ exclude system pages
    };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Page.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success:  true,
      message:  `${result.modifiedCount} page(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE PAGES ERROR:", error);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

exports.bulkDeletePages = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ message: "No pages selected" });

    const filter = {
      _id:      { $in: ids },
      isSystem: { $ne: true }, // ✅ exclude system pages
    };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const deletable    = await Page.find(filter).select("_id").lean();
    const deletableIds = deletable.map((p) => p._id);

    if (deletableIds.length === 0)
      return res.status(403).json({ message: "No deletable pages in selection" });

    await Page.deleteMany({ _id: { $in: deletableIds } });
    await Meta.deleteMany({ entity_type: "page", entity_id: { $in: deletableIds } });
    await SlugHistory.deleteMany({ entity_type: "page", entity_id: { $in: deletableIds } });

    res.status(200).json({
      success: true,
      message: `${deletableIds.length} page(s) deleted`,
      deleted: deletableIds.length,
    });
  } catch (error) {
    console.error("BULK DELETE PAGES ERROR:", error);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};



