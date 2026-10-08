const Industry = require("../modal/industrySchema");
const { publicPath, removeFile } = require("../utils/filestorage");
const slugify = require("slugify");

exports.addIndustry = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const imageFile = req.files?.["image"]?.[0];
    let { name, status, description } = req.body;
    name = name?.trim();
    description = description?.trim();

    if (!name) return res.status(400).json({ message: "Industry name is required" });

    const slug = slugify(name, { lower: true, strict: true, trim: true });
    const existing = await Industry.findOne({ slug });
    if (existing) return res.status(409).json({ message: "Industry already exists" });

    const industry = await Industry.create({
      name,
      slug,
      description: description || "",
      image: publicPath("industries", imageFile), // optional — null if not uploaded
      isActive: status === true || status === "true",
      adminId,
    });

    res.status(201).json({ success: true, message: "Industry added", data: industry });
  } catch (error) {
    console.error("ADD INDUSTRY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllIndustries = async (req, res) => {
  try {
    const industries = await Industry.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: industries });
  } catch (error) {
    console.error("GET INDUSTRIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch industries" });
  }
};

exports.getActiveIndustries = async (req, res) => {
  try {
    const industries = await Industry
      .find({ isActive: true })
      .select("name slug image")
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: industries });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch industries" });
  }
};

exports.getIndustryById = async (req, res) => {
  try {
    const industry = await Industry.findById(req.params.id);
    if (!industry) return res.status(404).json({ message: "Industry not found" });
    res.status(200).json({ success: true, data: industry });
  } catch (error) {
    console.error("GET INDUSTRY ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch industry" });
  }
};

exports.updateIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findById(id);
    if (!industry) return res.status(404).json({ message: "Industry not found" });

    const imageFile = req.files?.["image"]?.[0];
    const { name, status, description } = req.body;
    const trimmedName = name?.trim();

    if (trimmedName && trimmedName !== industry.name) {
      const newSlug = slugify(trimmedName, { lower: true, strict: true, trim: true });
      const taken = await Industry.findOne({ slug: newSlug, _id: { $ne: id } });
      if (taken) return res.status(409).json({ message: "An industry with this name already exists" });
      industry.slug = newSlug;
      industry.name = trimmedName;
    }

    if (imageFile) {
      removeFile(industry.image);
      industry.image = publicPath("industries", imageFile);
    }

    if (description !== undefined) industry.description = description.trim();
    if (status !== undefined) industry.isActive = status === true || status === "true";

    await industry.save();

    res.status(200).json({ success: true, message: "Industry updated", data: industry });
  } catch (error) {
    console.error("UPDATE INDUSTRY ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.toggleIndustryStatus = async (req, res) => {
  try {
    const industry = await Industry.findById(req.params.id);
    if (!industry) return res.status(404).json({ message: "Industry not found" });

    industry.isActive = !industry.isActive;
    await industry.save();

    res.status(200).json({
      success: true,
      message: industry.isActive ? "Industry enabled" : "Industry disabled",
    });
  } catch (error) {
    console.error("TOGGLE INDUSTRY ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

exports.deleteIndustry = async (req, res) => {
  try {
    const { id } = req.params;
    const industry = await Industry.findById(id);
    if (!industry) return res.status(404).json({ message: "Industry not found" });

    removeFile(industry.image);
    await Industry.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Industry deleted" });
  } catch (error) {
    console.error("DELETE INDUSTRY ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.bulkToggleIndustries = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No industries selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const result = await Industry.updateMany({ _id: { $in: ids } }, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} industry(ies) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE INDUSTRIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

exports.bulkDeleteIndustries = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No industries selected" });
    }

    const industries = await Industry.find({ _id: { $in: ids } }).select("_id image").lean();
    if (industries.length === 0) return res.status(404).json({ message: "No industries found" });

    for (const i of industries) removeFile(i.image);

    const result = await Industry.deleteMany({ _id: { $in: industries.map((i) => i._id) } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} industry(ies) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE INDUSTRIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};