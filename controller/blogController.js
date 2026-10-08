// controller/blogController.js — FINAL
// fixes: fileStorage casing, STEP logs removed, safe error logging
// ✅ draft/published workflow, isActive visibility, publishedAt (immutable),
//    editor-controlled lastContentUpdatedAt
// ✅ NEW: block-based content editor (contentBlocks) replacing fixed
//    description/quote/youtubeUrl fields
const crypto = require("crypto");
const Blog = require("../modal/blogSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const { archiveSlugIfChanged } = require("../utils/slugHelper");
const { publicPath, removeFile, removeFiles } = require("../utils/filestorage"); // ✅ correct casing
const slugify = require("slugify");
const mongoose = require("mongoose");
const { BLOCK_TYPES } = require("../modal/contentBlockSchema");
const calculateReadTime = require("../utils/calculateReadTime");

const VALID_PUBLICATION_STATUSES = ["draft", "published"];
const GALLERY_FOLDER = "blogs"; // gallery block images live alongside other blog uploads

const toBool = (val, fallback) => {
  if (val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  return val === "true";
};

// ── helpers ──────────────────────────────────────────────────
const parseIds = (val) => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};

const hasRealContent = (html) => (html || "").replace(/<[^>]*>/g, "").trim().length > 0;

// ── content block processing ──────────────────────────────────────────
// Consumes uploaded gallery files in order, matching them to empty
// placeholder slots (image: "") inside gallery blocks, in the same
// left-to-right order the frontend appended them.
const processContentBlocks = (rawBlocks, uploadedGalleryFiles) => {
  if (!Array.isArray(rawBlocks)) return [];
  const fileQueue = [...(uploadedGalleryFiles || [])];

  return rawBlocks
    .map((block) => {
      if (!block || !BLOCK_TYPES.includes(block.type)) return null;
      const blockId = block.blockId || crypto.randomUUID();

      if (block.type === "editor" || block.type === "quote") {
        return { blockId, type: block.type, label: (block.label || "").trim(), html: block.html || "" };
      }

      if (block.type === "youtube") {
        return { blockId, type: "youtube", youtubeUrl: (block.youtubeUrl || "").trim() };
      }

      if (block.type === "gallery") {
        const images = (block.images || [])
          .map((img) => {
            if (img.image) {
              // existing, already-uploaded image — keep as-is
              return { image: img.image, caption: img.caption || "" };
            }
            // placeholder for a newly-added image — consume the next queued file
            const file = fileQueue.shift();
            if (!file) return null; // no matching file arrived — drop the slot
            return { image: publicPath(GALLERY_FOLDER, file), caption: img.caption || "" };
          })
          .filter(Boolean);
        return { blockId, type: "gallery", images };
      }

      return null;
    })
    .filter(Boolean);
};

// collects every gallery image path across all blocks, for diffing on update
const collectGalleryPaths = (blocks) =>
  (blocks || [])
    .filter((b) => b.type === "gallery")
    .flatMap((b) => (b.images || []).map((img) => img.image))
    .filter(Boolean);

// ✅ NEW — per-block validation. Every block that exists must be genuinely
// complete; an "at least one block has content" check isn't enough because
// it would silently let a half-filled block through. Returns a message
// describing the first problem found, or null if everything is valid.
const validateBlocks = (blocks) => {
  if (!blocks.length) return "At least one content block is required";

  for (const b of blocks) {
    if (b.type === "editor" || b.type === "quote") {
      if (!b.label || !b.label.trim()) {
        return `Every ${b.type === "editor" ? "Editor" : "Quote"} block requires a label`;
      }
      if (!hasRealContent(b.html)) {
        return `Every ${b.type === "editor" ? "Editor" : "Quote"} block must have content`;
      }
    }

    if (b.type === "youtube") {
      if (!b.youtubeUrl) return "Every YouTube block requires a video URL";
    }

    if (b.type === "gallery") {
      if (!b.images || b.images.length === 0) {
        return "Every Gallery block requires at least one image";
      }
      if (b.images.some((img) => !img.caption || !img.caption.trim())) {
        return "Every gallery image requires a label";
      }
    }
  }

  return null;
};

// ================= ADD BLOG =================
exports.addBlogs = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const imageFile = req.files?.image?.[0];
    const ogFile    = req.files?.og_image?.[0];
    const twFile    = req.files?.twitter_image?.[0];
    const galleryFiles = req.files?.blockGalleryImages || [];



    const {
      title, author, shortDescription,
      contentBlocks, views,
      status, publicationStatus, meta,
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        message: "Title, author, and short description are required",
      });
    }

     const services           = parseIds(req.body.services);
      const relatedCaseStudies = parseIds(req.body.relatedCaseStudies);

    if (!mongoose.Types.ObjectId.isValid(author)) {
      return res.status(400).json({ message: "Invalid author ID" });
    }

    if (!imageFile) {
      return res.status(400).json({ message: "Blog image is required" });
    }

    let rawBlocks;
    try {
      rawBlocks = contentBlocks ? JSON.parse(contentBlocks) : [];
    } catch {
      return res.status(400).json({ message: "Invalid contentBlocks payload" });
    }
    
    const processedBlocks = processContentBlocks(rawBlocks, galleryFiles);
    const manualReadTime = req.body.readTime ? Number(req.body.readTime) : null;
    const readTime       = manualReadTime || calculateReadTime(processedBlocks); // ✅ manual wins, auto as fallback

    const blockError = validateBlocks(processedBlocks);
    if (blockError) {
      removeFiles(...galleryFiles.map((f) => publicPath(GALLERY_FOLDER, f)));
      return res.status(400).json({ message: blockError });
    }

    let resolvedPublicationStatus = "draft";
    if (publicationStatus !== undefined) {
      if (!VALID_PUBLICATION_STATUSES.includes(publicationStatus)) {
        return res.status(400).json({ message: "publicationStatus must be 'draft' or 'published'" });
      }
      resolvedPublicationStatus = publicationStatus;
    }

    const parsedMeta = meta
      ? typeof meta === "string" ? JSON.parse(meta) : meta
      : {};

    const slug = (
      parsedMeta.slug || slugify(title, { lower: true, strict: true, trim: true })
    ).toLowerCase().trim();

    const slugTaken     = await Meta.findOne({ slug, entity_type: "blog" });
    const slugInHistory = await SlugHistory.findOne({ old_slug: slug, entity_type: "blog" });

    if (slugTaken || slugInHistory) {
      removeFiles(
        publicPath("blogs", imageFile),
        publicPath("blogs", ogFile),
        publicPath("blogs", twFile),
        ...processedBlocks
          .filter((b) => b.type === "gallery")
          .flatMap((b) => b.images.map((img) => img.image))
      );
      return res.status(409).json({ message: "A blog with this slug already exists" });
    }

    const now = new Date();
    const isPublishingNow = resolvedPublicationStatus === "published";

    const blog = await Blog.create({
      title:      title.trim(),
      author,
      shortDescription,
      contentBlocks: processedBlocks,
      readTime:   Number(readTime) || 1,
      views:      views !== undefined && views !== "" ? Number(views) : undefined,
      image:      publicPath("blogs", imageFile),
      publicationStatus: resolvedPublicationStatus,
      isActive:   toBool(status, true),
      publishedAt: isPublishingNow ? now : null,
      lastContentUpdatedAt: isPublishingNow ? now : null,
      adminId,
      services,
      relatedCaseStudies,
    });

    if (Object.keys(parsedMeta).length > 0 || slug) {
      if (ogFile) parsedMeta.og_image      = publicPath("blogs", ogFile);
      if (twFile) parsedMeta.twitter_image = publicPath("blogs", twFile);
      parsedMeta.slug = slug;

      await Meta.findOneAndUpdate(
        { entity_type: "blog", entity_id: blog._id },
        { ...parsedMeta, entity_type: "blog", entity_id: blog._id },
        { new: true, upsert: true }
      );
    }

    res.status(201).json({ success: true, message: "Blog created", data: blog });
  } catch (error) {
    console.error("ADD BLOG ERROR:", error.message);
    res.status(500).json({ message: "Blog creation failed" });
  }
};

// ================= GET ALL BLOGS =================
exports.getAllBlogs = async (req, res) => {
  try {
    const filter = {};
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const blogs = await Blog.find(filter)
      .populate("author", "_id name")
      .sort({ createdAt: -1 })
      .lean();

    const blogIds = blogs.map((b) => b._id);

    const metas = await Meta.find({
      entity_type: "blog",
      entity_id: { $in: blogIds },
    }).lean();

    const metaMap = metas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m;
      return acc;
    }, {});

    const blogsWithMeta = blogs.map((b) => ({
      ...b,
      meta: metaMap[b._id.toString()] || {},
    }));

    res.status(200).json({ success: true, data: blogsWithMeta });
  } catch (error) {
    console.error("GET ALL BLOGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

exports.updateBlogFaqs = async (req, res) => {
  try {
    const { id } = req.params;
    const { faqs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }
    if (!Array.isArray(faqs)) {
      return res.status(400).json({ message: "faqs must be an array" });
    }

    const cleaned = faqs
      .map((f) => ({ question: (f.question || "").trim(), answer: (f.answer || "").trim() }))
      .filter((f) => f.question && f.answer);

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own blogs" });
    }

    blog.faqs = cleaned;
    await blog.save();

    res.status(200).json({ success: true, message: "FAQs updated", data: blog.faqs });
  } catch (error) {
    console.error("UPDATE Blog FAQS ERROR:", error.message);
    res.status(500).json({ message: "Failed to update FAQs" });
  }
};

// ================= GET BLOG BY ID =================
exports.getblogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await Blog.findById(id).populate("author", "_id name")
    .populate("relatedCaseStudies", "_id title slug bannerImage")
     .populate("services", "_id name slug");

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only view your own blogs" });
    }

    const meta = await Meta.findOne({ entity_type: "blog", entity_id: id });

    res.status(200).json({
      success: true,
      data: { ...blog.toObject(), meta: meta || {} },
    });
  } catch (error) {
    console.error("GET BLOG ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch blog" });
  }
};

// ================= UPDATE BLOG =================
exports.updateBlogs = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own blogs" });
    }

    const imageFile = req.files?.image?.[0];
    const ogFile    = req.files?.og_image?.[0];
    const twFile    = req.files?.twitter_image?.[0];
    const galleryFiles = req.files?.blockGalleryImages || [];

    const {
      title, author, shortDescription,
      contentBlocks, readTime, views,
      status, publicationStatus, updateLastContentDate,
      meta,
    } = req.body;

    if (author !== undefined && !mongoose.Types.ObjectId.isValid(author)) {
      return res.status(400).json({ message: "Invalid author ID" });
    }

    if (publicationStatus !== undefined && !VALID_PUBLICATION_STATUSES.includes(publicationStatus)) {
      return res.status(400).json({ message: "publicationStatus must be 'draft' or 'published'" });
    }

    let processedBlocks = null;
    if (contentBlocks !== undefined) {
      let rawBlocks;
      try {
        rawBlocks = JSON.parse(contentBlocks);
      } catch {
        return res.status(400).json({ message: "Invalid contentBlocks payload" });
      }
      processedBlocks = processContentBlocks(rawBlocks, galleryFiles);

      const blockError = validateBlocks(processedBlocks);
      if (blockError) {
        removeFiles(...galleryFiles.map((f) => publicPath(GALLERY_FOLDER, f)));
        return res.status(400).json({ message: blockError });
      }
    }

    const parsedMeta = meta
      ? typeof meta === "string" ? JSON.parse(meta) : meta
      : {};

    if (imageFile) {
      removeFile(blog.image);
      blog.image = publicPath("blogs", imageFile);
    }

    if (processedBlocks !== null) {
      // remove any gallery image files that are no longer referenced by the new blocks
      const oldPaths = collectGalleryPaths(blog.contentBlocks);
      const newPaths = collectGalleryPaths(processedBlocks);
      const orphaned = oldPaths.filter((p) => !newPaths.includes(p));
      if (orphaned.length) removeFiles(...orphaned);

      blog.contentBlocks = processedBlocks;
    }

    blog.title            = title            ?? blog.title;
    blog.author           = author           ?? blog.author;
    blog.shortDescription = shortDescription ?? blog.shortDescription;
    // ✅ manual wins — auto-calculate from contentBlocks if not provided
if (readTime !== undefined && Number(readTime) > 0) {
  blog.readTime = Number(readTime);
} else if (processedBlocks !== null) {
  blog.readTime = calculateReadTime(processedBlocks);
}
    if (views    !== undefined) blog.views    = views === "" ? undefined : Number(views);
    if (status   !== undefined) blog.isActive = toBool(status, blog.isActive);

     // relations
    const services     = parseIds(req.body.services);
    const related       = parseIds(req.body.relatedCaseStudies);

    if (req.body.services            !== undefined) blog.services           = services;  
    if (req.body.relatedCaseStudies  !== undefined) blog.relatedCaseStudies = related;
   

    
    const now = new Date();
    const wasPublished = blog.publicationStatus === "published";
    const willBePublished = publicationStatus !== undefined
      ? publicationStatus === "published"
      : wasPublished;

    if (publicationStatus !== undefined) {
      blog.publicationStatus = publicationStatus;
    }

    if (!wasPublished && willBePublished && !blog.publishedAt) {
      blog.publishedAt = now;
    }

    const editorOptedIn = toBool(updateLastContentDate, false);
    if ((!wasPublished && willBePublished) || editorOptedIn) {
      blog.lastContentUpdatedAt = now;
    }

    const existingMeta = await Meta.findOne({ entity_type: "blog", entity_id: id });
    const currentSlug  = existingMeta?.slug || "";
    const newSlug      = (parsedMeta.slug || currentSlug).toLowerCase().trim();

    if (newSlug && newSlug !== currentSlug) {
      const slugTaken = await Meta.findOne({
        slug: newSlug, entity_type: "blog", entity_id: { $ne: id },
      });
      const slugInHistory = await SlugHistory.findOne({
        old_slug: newSlug, entity_type: "blog", entity_id: { $ne: id },
      });

      if (slugTaken || slugInHistory) {
        return res.status(409).json({ message: "This slug is already in use" });
      }

      await archiveSlugIfChanged("blog", id, newSlug);
    }

    await blog.save();

    if (Object.keys(parsedMeta).length > 0) {
      if (ogFile) {
        removeFile(existingMeta?.og_image);
        parsedMeta.og_image = publicPath("blogs", ogFile);
      }
      if (twFile) {
        removeFile(existingMeta?.twitter_image);
        parsedMeta.twitter_image = publicPath("blogs", twFile);
      }
      if (newSlug) parsedMeta.slug = newSlug;

      await Meta.findOneAndUpdate(
        { entity_type: "blog", entity_id: id },
        { $set: { ...parsedMeta, entity_type: "blog", entity_id: id } },
        { new: true, upsert: true }
      );
    }

    const updatedBlog = await Blog.findById(id).populate("author", "_id name");

    res.status(200).json({ success: true, message: "Blog updated", data: updatedBlog });
  } catch (error) {
    console.error("UPDATE BLOG ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= REMOVE A SINGLE GALLERY IMAGE FROM A BLOCK =================
// ✅ NEW — mirrors the case-study module's immediate-delete gallery UX
exports.removeBlogBlockImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockId, imagePath } = req.body;

    if (!blockId || !imagePath) {
      return res.status(400).json({ message: "blockId and imagePath are required" });
    }

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own blogs" });
    }

    const block = blog.contentBlocks.find((b) => b.blockId === blockId && b.type === "gallery");
    if (!block) return res.status(404).json({ message: "Gallery block not found" });

    block.images = (block.images || []).filter((img) => img.image !== imagePath);
    await blog.save();
    removeFile(imagePath);

    res.status(200).json({ success: true, message: "Image removed" });
  } catch (error) {
    console.error("REMOVE BLOG BLOCK IMAGE ERROR:", error.message);
    res.status(500).json({ message: "Failed to remove image" });
  }
};

// ================= TOGGLE BLOG STATUS (isActive / visibility) =================
exports.toggleBlogStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own blogs" });
    }

    blog.isActive = !blog.isActive;
    await blog.save();

    res.status(200).json({
      success: true,
      message: blog.isActive ? "Blog enabled" : "Blog disabled",
    });
  } catch (error) {
    console.error("TOGGLE BLOG ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= PUBLISH / UNPUBLISH BLOG =================
exports.setBlogPublicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { publicationStatus } = req.body;

    if (!VALID_PUBLICATION_STATUSES.includes(publicationStatus)) {
      return res.status(400).json({ message: "publicationStatus must be 'draft' or 'published'" });
    }

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own blogs" });
    }

    const wasPublished = blog.publicationStatus === "published";
    const willBePublished = publicationStatus === "published";
    const now = new Date();

    blog.publicationStatus = publicationStatus;

    if (!wasPublished && willBePublished) {
      if (!blog.publishedAt) blog.publishedAt = now;
      blog.lastContentUpdatedAt = now;
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: willBePublished ? "Blog published" : "Blog moved to draft",
      data: blog,
    });
  } catch (error) {
    console.error("SET BLOG PUBLICATION STATUS ERROR:", error.message);
    res.status(500).json({ message: "Failed to update publication status" });
  }
};

// ================= DELETE BLOG =================
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (req.permissionScope === "own" && blog.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own blogs" });
    }

    const blogMeta = await Meta.findOneAndDelete({ entity_type: "blog", entity_id: id });
    removeFiles(
      blog.image,
      blogMeta?.og_image,
      blogMeta?.twitter_image,
      ...collectGalleryPaths(blog.contentBlocks)
    );

    await SlugHistory.deleteMany({ entity_type: "blog", entity_id: id });
    await Blog.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error.message);
    console.error(error.stack);
    res.status(500).json({ message: "Blog delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleBlogs = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No blogs selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Blog.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} blog(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE BLOGS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteBlogs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No blogs selected" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const blogs = await Blog.find(filter).select("_id image contentBlocks").lean();
    if (blogs.length === 0) {
      return res.status(404).json({ message: "No deletable blogs in selection" });
    }

    const blogIds = blogs.map((b) => b._id);

    for (const b of blogs) removeFiles(b.image, ...collectGalleryPaths(b.contentBlocks));

    const metas = await Meta.find({
      entity_type: "blog",
      entity_id: { $in: blogIds },
    }).lean();
    for (const m of metas) removeFiles(m.og_image, m.twitter_image);

    await Meta.deleteMany({ entity_type: "blog", entity_id: { $in: blogIds } });
    await SlugHistory.deleteMany({ entity_type: "blog", entity_id: { $in: blogIds } });

    const result = await Blog.deleteMany({ _id: { $in: blogIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} blog(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE BLOGS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};