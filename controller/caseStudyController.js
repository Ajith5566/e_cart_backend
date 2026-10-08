// controller/caseStudyController.js
const CaseStudy = require("../modal/caseStudySchema");
const Client = require("../modal/clientSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const { archiveSlugIfChanged } = require("../utils/slugHelper");
const { publicPath, removeFile, removeFiles } = require("../utils/filestorage");
const slugify = require("slugify");
const mongoose = require("mongoose");

// ── helpers ──────────────────────────────────────────────────
const parseIds = (val) => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};

const parseStatistics = (val) => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};

// ✅ ADD — galleryLabels arrives as either a single string (1 file) or
// an array of strings (multiple files), since it's sent as repeated
// FormData fields, not JSON. Normalize both cases to an array.
const parseGalleryLabels = (val) => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

// ================= ADD CASE STUDY =================
exports.addCaseStudy = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const bannerFile       = req.files?.["bannerImage"]?.[0];
    const logoFile         = req.files?.["logo"]?.[0];
    const galleryFiles     = req.files?.["gallery"] ?? [];
    const thumbFile        = req.files?.["testimonial_thumbnail"]?.[0];
    const ogImageFile      = req.files?.["og_image"]?.[0];
    const twitterImageFile = req.files?.["twitter_image"]?.[0];
    const overviewImageFile = req.files?.["overviewImage"]?.[0];
    const {
      title, shortDescription,
      clientName, clientCompany, clientDesignation,
      industry, timeline, websiteUrl,
      overview, challenge, proposedSolution, implementation, outcome,
      featured, status,
      meta,
      testimonial_clientName, testimonial_company, testimonial_designation,
      testimonial_quote, testimonial_video,location,tagline
    } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const services           = parseIds(req.body.services);
    const technologies       = parseIds(req.body.technologies);
    const solutions          = parseIds(req.body.solutions);
    const relatedCaseStudies = parseIds(req.body.relatedCaseStudies);
    const statistics         = parseStatistics(req.body.statistics);
    const galleryLabels      = parseGalleryLabels(req.body.galleryLabels);

    const parsedMeta = meta ? (typeof meta === "string" ? JSON.parse(meta) : meta) : {};
    const slug = (parsedMeta.slug || slugify(title, { lower: true, strict: true, trim: true })).toLowerCase().trim();

    if (ogImageFile)      parsedMeta.og_image      = publicPath("casestudies", ogImageFile);
    if (twitterImageFile) parsedMeta.twitter_image = publicPath("casestudies", twitterImageFile);
    



    const slugTaken     = await CaseStudy.findOne({ slug });
    const slugInHistory = await SlugHistory.findOne({ old_slug: slug, entity_type: "casestudy" });
    if (slugTaken || slugInHistory) {
      return res.status(409).json({ message: "A case study with this slug already exists" });
    }

    const caseStudy = await CaseStudy.create({
      title: title.trim(),
      slug,
      tagline:tagline || "",
      location:location || "",
      shortDescription: shortDescription || "",
      clientName:        clientName        || "",
      clientCompany:     clientCompany     || "",
      clientDesignation: clientDesignation || "",
      industry:   industry || null,
      services, technologies, solutions, relatedCaseStudies,
      timeline:   timeline   || "",
      websiteUrl: websiteUrl || "",
      bannerImage: publicPath("casestudies", bannerFile),
      logo:        publicPath("casestudies/logos", logoFile),
      overviewImage:publicPath("casestudies/overview", overviewImageFile),
      gallery: galleryFiles.map((f, i) => ({
        image: publicPath("casestudies/gallery", f),
        label: galleryLabels[i] ?? "",
      })),
      overview:         overview         || "",
      challenge:        challenge        || "",
      proposedSolution: proposedSolution || "",
      implementation:   implementation   || "",
      outcome:          outcome          || "",
      statistics,
      testimonial: {
        clientName:  testimonial_clientName  || "",
        company:     testimonial_company     || "",
        designation: testimonial_designation || "",
        quote:       testimonial_quote       || "",
        video:       testimonial_video       || "",
        thumbnail:   publicPath("casestudies/thumbnails", thumbFile),
      },
      featured:     featured     === true || featured     === "true",
      isActive:     status       === true || status       === "true",
      adminId,
    });

    if (Object.keys(parsedMeta).length > 0 || slug) {
      parsedMeta.slug = slug;
      await Meta.findOneAndUpdate(
        { entity_type: "casestudy", entity_id: caseStudy._id },
        { ...parsedMeta, entity_type: "casestudy", entity_id: caseStudy._id },
        { new: true, upsert: true }
      );
    }

    res.status(201).json({ success: true, message: "Case study created", data: caseStudy });
  } catch (error) {
    console.error("ADD CASE STUDY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL (admin list) =================
exports.getAllCaseStudies = async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find()
      .select("title slug shortDescription bannerImage logo featured isActive displayOrder createdAt")
      .sort({ displayOrder: 1, createdAt: -1 }) // ✅ sort by displayOrder so drag-reorder persists on reload
      .lean();

    res.status(200).json({ success: true, data: caseStudies });
  } catch (error) {
    console.error("GET CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch case studies" });
  }
};

// ================= GET BY ID (admin edit form) =================
exports.getCaseStudyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const caseStudy = await CaseStudy.findById(id)
      .populate("industry", "_id name")
      .populate("services", "_id name slug")
      .populate("technologies", "_id name slug logo")
      .populate("solutions", "_id name slug")
      .populate("relatedCaseStudies", "_id title slug bannerImage")
      .lean();

    if (!caseStudy) return res.status(404).json({ message: "Case study not found" });

    const meta = await Meta.findOne({ entity_type: "casestudy", entity_id: id });

    res.status(200).json({ success: true, data: { ...caseStudy, meta: meta || {} } });
  } catch (error) {
    console.error("GET CASE STUDY ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch case study" });
  }
};

// ================= GET BY SLUG (public) =================
exports.getCaseStudyBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    const caseStudy = await CaseStudy.findOne({ slug, isActive: true })
      .populate("industry", "_id name")
      .populate("services", "_id name slug icon")
      .populate("technologies", "_id name slug logo")
      .populate("solutions", "_id name slug")
      .populate("relatedCaseStudies", "_id title slug bannerImage shortDescription")
      .lean();

    if (caseStudy) {
      const meta = await Meta.findOne({ entity_type: "casestudy", entity_id: caseStudy._id });
      return res.status(200).json({ success: true, data: { ...caseStudy, meta: meta || {} } });
    }

    const history = await SlugHistory.findOne({ old_slug: slug, entity_type: "casestudy" });
    if (history) {
      const current = await CaseStudy.findById(history.entity_id).select("slug").lean();
      if (current?.slug) {
        return res.status(200).json({ redirect: true, newSlug: current.slug });
      }
    }

    return res.status(404).json({ message: "Case study not found" });
  } catch (error) {
    console.error("GET CASE STUDY BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE =================
exports.updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const caseStudy = await CaseStudy.findById(id);
    if (!caseStudy) return res.status(404).json({ message: "Case study not found" });

    const bannerFile       = req.files?.["bannerImage"]?.[0];
    const logoFile         = req.files?.["logo"]?.[0];
    const galleryFiles     = req.files?.["gallery"] ?? [];
    const thumbFile        = req.files?.["testimonial_thumbnail"]?.[0];
    const ogImageFile      = req.files?.["og_image"]?.[0];
    const twitterImageFile = req.files?.["twitter_image"]?.[0];
     const overviewImageFile = req.files?.["overviewImage"]?.[0];

    const {
      title, shortDescription,
      clientName, clientCompany, clientDesignation,
      industry, timeline, websiteUrl,
      overview, challenge, proposedSolution, implementation, outcome,
      featured, status,
      meta,
      testimonial_clientName, testimonial_company, testimonial_designation,
      testimonial_quote, testimonial_video,location,tagline
    } = req.body;

    const parsedMeta    = meta ? (typeof meta === "string" ? JSON.parse(meta) : meta) : {};
    const galleryLabels = parseGalleryLabels(req.body.galleryLabels);

    // slug handling
    const existingMeta = await Meta.findOne({ entity_type: "casestudy", entity_id: id });
    const currentSlug  = existingMeta?.slug || caseStudy.slug;
    const newSlug      = (parsedMeta.slug || currentSlug).toLowerCase().trim();

    if (newSlug !== currentSlug) {
      const slugTaken = await CaseStudy.findOne({ slug: newSlug, _id: { $ne: id } });
      const slugInHistory = await SlugHistory.findOne({ old_slug: newSlug, entity_type: "casestudy", entity_id: { $ne: id } });
      if (slugTaken || slugInHistory) return res.status(409).json({ message: "Slug already in use" });
      await archiveSlugIfChanged("casestudy", id, newSlug);
      caseStudy.slug = newSlug;
    }

    // SEO images
    if (ogImageFile) {
      if (existingMeta?.og_image) removeFile(existingMeta.og_image);
      parsedMeta.og_image = publicPath("casestudies", ogImageFile);
    }
    if (twitterImageFile) {
      if (existingMeta?.twitter_image) removeFile(existingMeta.twitter_image);
      parsedMeta.twitter_image = publicPath("casestudies", twitterImageFile);
    }

    // image replacement
    if (bannerFile) { removeFile(caseStudy.bannerImage); caseStudy.bannerImage = publicPath("casestudies", bannerFile); }
    if (logoFile)   { removeFile(caseStudy.logo);        caseStudy.logo        = publicPath("casestudies/logos", logoFile); }
     if (overviewImageFile)   { removeFile(caseStudy.overviewImage);        caseStudy.overviewImage        = publicPath("casestudies/overview", overviewImageFile); }


    // ✅ gallery: append new { image, label } objects
    if (galleryFiles.length > 0) {
      const newItems = galleryFiles.map((f, i) => ({
        image: publicPath("casestudies/gallery", f),
        label: galleryLabels[i] ?? "",
      }));
      caseStudy.gallery = [...(caseStudy.gallery || []), ...newItems];
    }

    // ✅ update labels on existing gallery items
    if (req.body.existingGalleryLabels) {
      try {
        const updatedLabels = JSON.parse(req.body.existingGalleryLabels);
        caseStudy.gallery = caseStudy.gallery.map((item, i) => ({
          image: item.image,
          label: updatedLabels[i] ?? item.label,
        }));
      } catch { /* ignore parse errors */ }
    }

    if (thumbFile) {
      removeFile(caseStudy.testimonial?.thumbnail);
      caseStudy.testimonial.thumbnail = publicPath("casestudies/thumbnails", thumbFile);
    }
    // after image replacement section
if (req.body.removeThumbnail === "true" && !thumbFile) {
  removeFile(caseStudy.testimonial?.thumbnail);
  caseStudy.testimonial.thumbnail = "";
}

    if (title            !== undefined) caseStudy.title            = title.trim();
     if (location        !== undefined) caseStudy.location            = location.trim();
      if (tagline           !== undefined) caseStudy.tagline           = tagline.trim();
    if (shortDescription !== undefined) caseStudy.shortDescription = shortDescription;
    if (clientName       !== undefined) caseStudy.clientName       = clientName;
    if (clientCompany    !== undefined) caseStudy.clientCompany    = clientCompany;
    if (clientDesignation!== undefined) caseStudy.clientDesignation= clientDesignation;
    if (industry         !== undefined) caseStudy.industry         = industry || null;
    if (timeline         !== undefined) caseStudy.timeline         = timeline;
    if (websiteUrl       !== undefined) caseStudy.websiteUrl       = websiteUrl;
    if (overview         !== undefined) caseStudy.overview         = overview;
    if (challenge        !== undefined) caseStudy.challenge        = challenge;
    if (proposedSolution !== undefined) caseStudy.proposedSolution = proposedSolution;
    if (implementation   !== undefined) caseStudy.implementation   = implementation;
    if (outcome          !== undefined) caseStudy.outcome          = outcome;
    if (featured         !== undefined) caseStudy.featured         = featured === true || featured === "true";
    if (status           !== undefined) caseStudy.isActive         = status === true || status === "true";

    // relations
    const services     = parseIds(req.body.services);
    const technologies = parseIds(req.body.technologies);
    const solutions    = parseIds(req.body.solutions);
    const related       = parseIds(req.body.relatedCaseStudies);
    const statistics   = parseStatistics(req.body.statistics);

    if (req.body.services            !== undefined) caseStudy.services           = services;
    if (req.body.technologies        !== undefined) caseStudy.technologies       = technologies;
    if (req.body.solutions           !== undefined) caseStudy.solutions          = solutions;
    if (req.body.relatedCaseStudies  !== undefined) caseStudy.relatedCaseStudies = related;
    if (req.body.statistics          !== undefined) caseStudy.statistics         = statistics;

    if (testimonial_clientName  !== undefined) caseStudy.testimonial.clientName  = testimonial_clientName;
    if (testimonial_company     !== undefined) caseStudy.testimonial.company     = testimonial_company;
    if (testimonial_designation !== undefined) caseStudy.testimonial.designation = testimonial_designation;
    if (testimonial_quote       !== undefined) caseStudy.testimonial.quote       = testimonial_quote;
    if (testimonial_video       !== undefined) caseStudy.testimonial.video       = testimonial_video;

    await caseStudy.save();

    if (Object.keys(parsedMeta).length > 0) {
      parsedMeta.slug = newSlug;
      await Meta.findOneAndUpdate(
        { entity_type: "casestudy", entity_id: id },
        { $set: { ...parsedMeta, entity_type: "casestudy", entity_id: id } },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({ success: true, message: "Case study updated", data: caseStudy });
  } catch (error) {
    console.error("UPDATE CASE STUDY ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleCaseStudyStatus = async (req, res) => {
  try {
    const cs = await CaseStudy.findById(req.params.id);
    if (!cs) return res.status(404).json({ message: "Case study not found" });
    cs.isActive = !cs.isActive;
    await cs.save();
    res.status(200).json({ success: true, message: cs.isActive ? "Case study enabled" : "Case study disabled" });
  } catch (error) {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE =================
exports.deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const cs = await CaseStudy.findById(id);
    if (!cs) return res.status(404).json({ message: "Case study not found" });

    removeFile(cs.bannerImage);
    removeFile(cs.logo);
    removeFile(cs.testimonial?.thumbnail);
    // ✅ FIXED — gallery items are now { image, label } objects, not plain strings
    for (const item of cs.gallery ?? []) removeFile(item.image);

    await Meta.findOneAndDelete({ entity_type: "casestudy", entity_id: id });
    await SlugHistory.deleteMany({ entity_type: "casestudy", entity_id: id });
    await CaseStudy.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Case study deleted" });
  } catch (error) {
    console.error("DELETE CASE STUDY ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleCaseStudies = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No case studies selected" });
    if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be boolean" });
    const result = await CaseStudy.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
    res.status(200).json({ success: true, message: `${result.modifiedCount} case stud${result.modifiedCount === 1 ? "y" : "ies"} ${isActive ? "activated" : "deactivated"}`, modified: result.modifiedCount });
  } catch (error) {
    console.error("BULK TOGGLE CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk toggle failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteCaseStudies = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No case studies selected" });

    const caseStudies = await CaseStudy.find({ _id: { $in: ids } }).lean();
    if (caseStudies.length === 0) return res.status(404).json({ message: "No case studies found" });

    const csIds = caseStudies.map((cs) => cs._id);

    for (const cs of caseStudies) {
      removeFile(cs.bannerImage);
      removeFile(cs.logo);
      removeFile(cs.testimonial?.thumbnail);
      // ✅ FIXED — gallery items are now { image, label } objects
      for (const item of cs.gallery ?? []) removeFile(item.image);
    }

    await Meta.deleteMany({ entity_type: "casestudy", entity_id: { $in: csIds } });
    await SlugHistory.deleteMany({ entity_type: "casestudy", entity_id: { $in: csIds } });

    const result = await CaseStudy.deleteMany({ _id: { $in: csIds } });

    res.status(200).json({ success: true, message: `${result.deletedCount} case stud${result.deletedCount === 1 ? "y" : "ies"} deleted`, deleted: result.deletedCount });
  } catch (error) {
    console.error("BULK DELETE CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= REMOVE GALLERY IMAGE =================
// DELETE /admin/casestudies/:id/gallery — body: { imagePath: string }
exports.removeGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagePath } = req.body;

    const cs = await CaseStudy.findById(id);
    if (!cs) return res.status(404).json({ message: "Case study not found" });

    // ✅ FIXED — filter by item.image, not the item itself (was always true before, a no-op bug)
    cs.gallery = cs.gallery.filter((item) => item.image !== imagePath);
    removeFile(imagePath);
    await cs.save();

    res.status(200).json({ success: true, message: "Gallery image removed", gallery: cs.gallery });
  } catch (error) {
    console.error("REMOVE GALLERY IMAGE ERROR:", error.message);
    res.status(500).json({ message: "Failed to remove gallery image" });
  }
};

// ================= UPDATE ORDER =================
exports.updateCaseStudyOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder } },
      },
    }));

    await CaseStudy.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};

// ================= AVAILABLE CASE STUDIES =================
// Returns case studies not yet assigned to any client.
// Pass ?excludeClient=<clientId> when editing, so the client's own stays in the list.
exports.getAvailableCaseStudies = async (req, res) => {
  try {
   /*  console.log(req.query); */
    
    const { excludeClient } = req.query;

    const clientFilter = { caseStudy: { $ne: null } };
    if (excludeClient && mongoose.Types.ObjectId.isValid(excludeClient)) {
      clientFilter._id = { $ne: excludeClient };
    }

    const taken = await Client.find(clientFilter).distinct("caseStudy");

    const caseStudies = await CaseStudy.find({ _id: { $nin: taken } })
      .select("_id title slug")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: caseStudies });
  } catch (error) {
    console.error("GET AVAILABLE CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch case studies" });
  }
};