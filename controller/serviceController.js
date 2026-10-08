// controller/serviceController.js
const Service = require("../modal/serviceSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const CaseStudy = require("../modal/caseStudySchema");
const { archiveSlugIfChanged } = require("../utils/slugHelper");
const { publicPath, removeFile, removeFiles } = require("../utils/filestorage");
const slugify = require("slugify");
const mongoose = require("mongoose");

const toBool = (val, fallback) => {
  if (val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  return val === "true";
};

const parseIds = (val) => {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
};


// ✅ hierarchy-aware validation. A top-level service (parentService: null)
// and a leaf service (parentService: <id>) require different fields —
// this mirrors exactly which fields the admin form shows/hides for each.
const validateHierarchyFields = (isTopLevel, data) => {
  if (isTopLevel) {
    if (!data.description || !data.description.trim()) {
      return "Description is required for a top-level service";
    }
  } else {
    if (!data.shortDescription || !data.shortDescription.trim()) {
      return "Short description is required for a leaf service";
    }
    if (!data.introTitle || !data.introTitle.trim()) {
      return "Intro title is required for a leaf service";
    }
    if (!data.introDescription || !data.introDescription.trim()) {
      return "Intro description is required for a leaf service";
    }
  }
  return null;
};

// ✅ row-level validation for the embedded arrays. The schema marks
// process.title/description as required, so a half-filled row would throw
// a raw Mongoose ValidationError and surface as a generic 500 — catch it
// here and return a message the admin form can actually show.
const validateProcess = (process) => {
  if (!Array.isArray(process)) return "process must be an array";
  for (let i = 0; i < process.length; i++) {
    const p = process[i] || {};
    if (!p.title || !String(p.title).trim()) return `Process step ${i + 1}: title is required`;
    if (!p.description || !String(p.description).trim()) return `Process step ${i + 1}: description is required`;
  }
  return null;
};

const validateTechnologies = (technologies) => {
  if (!Array.isArray(technologies)) return "technologies must be an array";
  const seen = new Set();
  for (let i = 0; i < technologies.length; i++) {
    const t = technologies[i] || {};
    if (!t.technology) return `Technology ${i + 1}: select a technology`;
    if (!mongoose.Types.ObjectId.isValid(t.technology)) return `Technology ${i + 1}: invalid technology ID`;
    const key = String(t.technology);
    if (seen.has(key)) return `Technology ${i + 1}: duplicate technology`;
    seen.add(key);
    if (!t.description || !String(t.description).trim()) return `Technology ${i + 1}: description is required`;
  }
  return null;
};

// ================= ADD SERVICE =================
exports.addService = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const bannerFile = req.files?.bannerImage?.[0];
    const heroFile = req.files?.heroImage?.[0];
    const ogFile = req.files?.og_image?.[0];
    const twFile = req.files?.twitter_image?.[0];

    // every early return has to unlink all four uploads, not just two
    const cleanup = () =>
      removeFiles(
        bannerFile ? publicPath("services", bannerFile) : null,
        heroFile ? publicPath("services", heroFile) : null,
        ogFile ? publicPath("services", ogFile) : null,
        twFile ? publicPath("services", twFile) : null
      );

    const {
      title, parentService, description, bullets,subTitle,
      shortDescription, tagline, introTitle, introDescription,
      process: processJson, technologies, featured, status, meta,
    } = req.body;

    if (!title || !title.trim()) {
      cleanup();
      return res.status(400).json({ message: "Title is required" });
    }
     const industries           = parseIds(req.body.industries);

    const resolvedParent = parentService && parentService !== "null" ? parentService : null;
    if (resolvedParent && !mongoose.Types.ObjectId.isValid(resolvedParent)) {
      cleanup();
      return res.status(400).json({ message: "Invalid parent service ID" });
    }
    if (resolvedParent) {
      const parent = await Service.findById(resolvedParent);
      if (!parent) {
        cleanup();
        return res.status(400).json({ message: "Parent service not found" });
      }
      if (parent.parentService) {
        cleanup();
        return res.status(400).json({ message: "Cannot nest a service under a leaf service — only two levels are allowed" });
      }
    }

    const isTopLevel = !resolvedParent;

    const payload = {
      description: description || "",
      bullets: bullets ? JSON.parse(bullets) : [],
      shortDescription: shortDescription || "",
      tagline: tagline || "",
      introTitle: introTitle || "",
      introDescription: introDescription || "",
    };

    const hierarchyError = validateHierarchyFields(isTopLevel, payload);
    if (hierarchyError) {
      cleanup();
      return res.status(400).json({ message: hierarchyError });
    }

    // ── embedded arrays (leaf services only) ──
    const parsedProcess = processJson ? JSON.parse(processJson) : [];
    const parsedTechnologies = technologies ? JSON.parse(technologies) : [];

    if (!isTopLevel) {
      const processError = validateProcess(parsedProcess);
      if (processError) {
        cleanup();
        return res.status(400).json({ message: processError });
      }
      const techError = validateTechnologies(parsedTechnologies);
      if (techError) {
        cleanup();
        return res.status(400).json({ message: techError });
      }
    }

    // ── META ──
    const parsedMeta = meta ? (typeof meta === "string" ? JSON.parse(meta) : meta) : {};
    if (ogFile) parsedMeta.og_image = publicPath("services", ogFile);
    if (twFile) parsedMeta.twitter_image = publicPath("services", twFile);

    const slug = (parsedMeta.slug || slugify(title, { lower: true, strict: true, trim: true })).toLowerCase().trim();

    const slugTaken = await Meta.findOne({ slug, entity_type: "service" });
    const slugInHistory = await SlugHistory.findOne({ old_slug: slug, entity_type: "service" });
    if (slugTaken || slugInHistory) {
      cleanup();
      return res.status(409).json({ message: "A service with this slug already exists" });
    }

    const service = await Service.create({
      title: title.trim(),
      subTitle:subTitle.trim(),
      slug,
      industries,
      parentService: resolvedParent,
      ...payload,
      bannerImage: bannerFile ? publicPath("services", bannerFile) : "",
      heroImage: heroFile ? publicPath("services", heroFile) : "",
      process: isTopLevel ? [] : parsedProcess,
      technologies: isTopLevel ? [] : parsedTechnologies,
      faqs: [], // FAQs are managed exclusively via the dedicated endpoint, post-creation
      featured: toBool(featured, false),
      isActive: toBool(status, true),
      adminId,
    });

    // slug is always truthy, so the Meta doc is always created
    parsedMeta.slug = slug;
    await Meta.findOneAndUpdate(
      { entity_type: "service", entity_id: service._id },
      { ...parsedMeta, entity_type: "service", entity_id: service._id },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, message: "Service created", data: service });
  } catch (error) {
    console.error("ADD SERVICE ERROR:", error.message);
    res.status(500).json({ message: "Service creation failed" });
  }
};

// ================= GET ALL SERVICES =================
// supports ?topLevelOnly=true — used by the admin form's "Parent Service"
// picker, which may only offer services with parentService === null
exports.getAllServices = async (req, res) => {
  try {
    const filter = {};
    if (req.permissionScope === "own") filter.adminId = req.adminId;
    if (req.query.topLevelOnly === "true") filter.parentService = null;
    if (req.query.parentService) filter.parentService = req.query.parentService;

    const services = await Service.find(filter)
      .populate("parentService", "_id title")
      .populate("technologies.technology", "_id name icon")
      .sort({ displayOrder: 1})
      .lean();

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error("GET ALL SERVICES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// ================= GET SERVICE BY ID =================
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id)
      .populate("parentService", "_id title subTitle")
      .populate("technologies.technology", "_id name icon")
       .populate("industries", "_id name");
    if (!service) return res.status(404).json({ message: "Service not found" });

    const meta = await Meta.findOne({ entity_type: "service", entity_id: id });

    res.status(200).json({ success: true, data: { ...service.toObject(), meta: meta || {} } });
  } catch (error) {
    console.error("GET SERVICE ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch service" });
  }
};

// ================= UPDATE SERVICE (excludes FAQs — dedicated endpoint below) =================
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (req.permissionScope === "own" && service.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own services" });
    }

    const bannerFile = req.files?.bannerImage?.[0];
    const heroFile = req.files?.heroImage?.[0];
    const ogFile = req.files?.og_image?.[0];
    const twFile = req.files?.twitter_image?.[0];

    const {
      title, parentService, description, bullets,subTitle,
      shortDescription, tagline, introTitle, introDescription,
      process: processJson, technologies,featured, status, meta,
    } = req.body;

    let resolvedParent = service.parentService;
    if (parentService !== undefined) {
      resolvedParent = parentService && parentService !== "null" ? parentService : null;
      if (resolvedParent) {
        if (!mongoose.Types.ObjectId.isValid(resolvedParent)) {
          return res.status(400).json({ message: "Invalid parent service ID" });
        }
        if (resolvedParent === id) {
          return res.status(400).json({ message: "A service cannot be its own parent" });
        }
        const parent = await Service.findById(resolvedParent);
        if (!parent) return res.status(400).json({ message: "Parent service not found" });
        if (parent.parentService) {
          return res.status(400).json({ message: "Cannot nest a service under a leaf service — only two levels are allowed" });
        }
      }
    }

    // a service with children can't be demoted to a leaf — that would
    // orphan them under a parent that is itself nested
    if (resolvedParent && !service.parentService) {
      const childCount = await Service.countDocuments({ parentService: id });
      if (childCount > 0) {
        return res.status(409).json({
          message: "This service has child services under it — move them first before giving it a parent",
        });
      }
    }

    const isTopLevel = !resolvedParent;

    const merged = {
      description: description ?? service.description,
      shortDescription: shortDescription ?? service.shortDescription,
      tagline: tagline ?? service.tagline,
      introTitle: introTitle ?? service.introTitle,
      introDescription: introDescription ?? service.introDescription,
    };

    const hierarchyError = validateHierarchyFields(isTopLevel, merged);
    if (hierarchyError) return res.status(400).json({ message: hierarchyError });

    // ── embedded arrays ──
    let parsedProcess;
    let parsedTechnologies;

    if (processJson !== undefined) {
      parsedProcess = JSON.parse(processJson);
      const processError = validateProcess(parsedProcess);
      if (processError) return res.status(400).json({ message: processError });
    }
    if (technologies !== undefined) {
      parsedTechnologies = JSON.parse(technologies);
      const techError = validateTechnologies(parsedTechnologies);
      if (techError) return res.status(400).json({ message: techError });
    }
    
    if (bannerFile) {
      removeFile(service.bannerImage);
      service.bannerImage = publicPath("services", bannerFile);
    }
    if (heroFile) {
      removeFile(service.heroImage);
      service.heroImage = publicPath("services", heroFile);
    }

    service.parentService = resolvedParent;
    service.title = title !== undefined ? title.trim() : service.title;
    service.subTitle = subTitle !== undefined ? subTitle.trim() : service.subTitle;
    service.description = merged.description;
    service.shortDescription = merged.shortDescription;
    service.tagline = merged.tagline;
    service.introTitle = merged.introTitle;
    service.introDescription = merged.introDescription;
    if (bullets !== undefined) service.bullets = JSON.parse(bullets);
    if (req.body.industries !== undefined) service.industries = parseIds(req.body.industries); // ✅
    if (parsedProcess !== undefined) service.process = isTopLevel ? [] : parsedProcess;
    if (parsedTechnologies !== undefined) service.technologies = isTopLevel ? [] : parsedTechnologies;
    if (featured !== undefined) service.featured = toBool(featured, service.featured);
    if (status !== undefined) service.isActive = toBool(status, service.isActive);
    // NOTE: service.faqs is intentionally untouched here — see updateServiceFaqs

    // ── META ──
    const parsedMeta = meta ? (typeof meta === "string" ? JSON.parse(meta) : meta) : {};
    const existingMeta = await Meta.findOne({ entity_type: "service", entity_id: id });
    const currentSlug = existingMeta?.slug || service.slug;
    const newSlug = (parsedMeta.slug || currentSlug).toLowerCase().trim();

    // SEO images: replaced → unlink the old file; cleared to "" → unlink too
    if (ogFile) {
      removeFile(existingMeta?.og_image);
      parsedMeta.og_image = publicPath("services", ogFile);
    } else if (parsedMeta.og_image === "" && existingMeta?.og_image) {
      removeFile(existingMeta.og_image);
    }

    if (twFile) {
      removeFile(existingMeta?.twitter_image);
      parsedMeta.twitter_image = publicPath("services", twFile);
    } else if (parsedMeta.twitter_image === "" && existingMeta?.twitter_image) {
      removeFile(existingMeta.twitter_image);
    }

    if (newSlug && newSlug !== currentSlug) {
      const slugTaken = await Meta.findOne({ slug: newSlug, entity_type: "service", entity_id: { $ne: id } });
      const slugInHistory = await SlugHistory.findOne({ old_slug: newSlug, entity_type: "service", entity_id: { $ne: id } });
      if (slugTaken || slugInHistory) {
        return res.status(409).json({ message: "This slug is already in use" });
      }
      await archiveSlugIfChanged("service", id, newSlug);
      service.slug = newSlug;
    }

    await service.save();

    // upsert even when only an image changed — the old
    // Object.keys(parsedMeta).length check skipped that case
    if (Object.keys(parsedMeta).length > 0 || ogFile || twFile) {
      if (newSlug) parsedMeta.slug = newSlug;
      await Meta.findOneAndUpdate(
        { entity_type: "service", entity_id: id },
        { $set: { ...parsedMeta, entity_type: "service", entity_id: id } },
        { new: true, upsert: true }
      );
    }

    const updated = await Service.findById(id).populate("parentService", "_id title");

    res.status(200).json({ success: true, message: "Service updated", data: updated });
  } catch (error) {
    console.error("UPDATE SERVICE ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= UPDATE FAQs ONLY (dedicated endpoint, table quick-action) =================
exports.updateServiceFaqs = async (req, res) => {
  try {
    const { id } = req.params;
    const { faqs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }
    if (!Array.isArray(faqs)) {
      return res.status(400).json({ message: "faqs must be an array" });
    }

    const cleaned = faqs
      .map((f) => ({ question: (f.question || "").trim(), answer: (f.answer || "").trim() }))
      .filter((f) => f.question && f.answer);

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (req.permissionScope === "own" && service.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own services" });
    }

    service.faqs = cleaned;
    await service.save();

    res.status(200).json({ success: true, message: "FAQs updated", data: service.faqs });
  } catch (error) {
    console.error("UPDATE SERVICE FAQS ERROR:", error.message);
    res.status(500).json({ message: "Failed to update FAQs" });
  }
};

// ================= DERIVED: RELATED CASE STUDIES / INDUSTRIES / SERVICES =================
exports.getServiceRelations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const relatedCaseStudies = await CaseStudy.find({ services: id, isActive: true })
      .select("_id title image industry")
      .populate("industry", "_id name")
      .limit(6)
      .lean();

    const industryMap = new Map();
    for (const cs of relatedCaseStudies) {
      if (cs.industry && !industryMap.has(cs.industry._id.toString())) {
        industryMap.set(cs.industry._id.toString(), cs.industry);
      }
    }

    const relatedServices = service.parentService
      ? await Service.find({ parentService: service.parentService, _id: { $ne: id }, isActive: true })
          .select("_id title shortDescription slug")
          .limit(3)
          .lean()
      : [];

    res.status(200).json({
      success: true,
      data: {
        relatedCaseStudies,
        relatedIndustries: Array.from(industryMap.values()),
        relatedServices,
      },
    });
  } catch (error) {
    console.error("GET SERVICE RELATIONS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch related content" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (req.permissionScope === "own" && service.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own services" });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({ success: true, message: service.isActive ? "Service enabled" : "Service disabled" });
  } catch (error) {
    console.error("TOGGLE SERVICE ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleServices = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No services selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Service.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} service(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE SERVICES ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteServices = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No services selected" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const services = await Service.find(filter).select("_id bannerImage heroImage").lean();
    if (services.length === 0) {
      return res.status(404).json({ message: "No deletable services in selection" });
    }

    const ids2delete = services.map((s) => s._id);

    // skip (don't delete) any that still have child services under them
    const childCounts = await Service.aggregate([
      { $match: { parentService: { $in: ids2delete } } },
      { $group: { _id: "$parentService", count: { $sum: 1 } } },
    ]);
    const blockedIds = new Set(childCounts.map((c) => c._id.toString()));
    const deletable = services.filter((s) => !blockedIds.has(s._id.toString()));
    const skipped = services.length - deletable.length;

    if (deletable.length === 0) {
      return res.status(409).json({ message: "All selected services still have child services under them" });
    }

    for (const s of deletable) removeFiles(s.bannerImage, s.heroImage);

    const deletableIds = deletable.map((s) => s._id);
    const metas = await Meta.find({ entity_type: "service", entity_id: { $in: deletableIds } }).lean();
    for (const m of metas) removeFiles(m.og_image, m.twitter_image);

    await Meta.deleteMany({ entity_type: "service", entity_id: { $in: deletableIds } });
    await SlugHistory.deleteMany({ entity_type: "service", entity_id: { $in: deletableIds } });
    const result = await Service.deleteMany({ _id: { $in: deletableIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} service(s) deleted${skipped ? `, ${skipped} skipped (has child services)` : ""}`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE SERVICES ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= DELETE SERVICE =================
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (req.permissionScope === "own" && service.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own services" });
    }

    const childCount = await Service.countDocuments({ parentService: id });
    if (childCount > 0) {
      return res.status(409).json({ message: "Cannot delete a service that still has child services under it" });
    }

    const meta = await Meta.findOneAndDelete({ entity_type: "service", entity_id: id });
    removeFiles(service.bannerImage, service.heroImage, meta?.og_image, meta?.twitter_image);
    await SlugHistory.deleteMany({ entity_type: "service", entity_id: id });
    await Service.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Service deleted" });
  } catch (error) {
    console.error("DELETE SERVICE ERROR:", error.message);
    res.status(500).json({ message: "Service delete failed" });
  }
};

// ================= UPDATE ORDER =================
exports.updateServiceOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const invalid = updates.some(
      ({ id, displayOrder }) =>
        !mongoose.Types.ObjectId.isValid(id) || !Number.isInteger(displayOrder)
    );
    if (invalid) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const scope = req.permissionScope === "own" ? { adminId: req.adminId } : {};

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id, ...scope },
        update: { $set: { displayOrder } },
      },
    }));

    await Service.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE SERVICE ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};