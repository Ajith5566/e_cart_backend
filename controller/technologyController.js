// controller/technologyController.js
const Technology = require("../modal/technologySchema");
const { publicPath, removeFile } = require("../utils/filestorage");
const slugify = require("slugify");

// ================= ADD =================
exports.addTechnology = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const logoFile = req.files?.["logo"]?.[0];

    let { name, status,description,tag} = req.body;
    name = name?.trim();
    tag=tag?.trim();
    description = description?.trim();
    if (!name) return res.status(400).json({ message: "Technology name is required" });

    const slug = slugify(name, { lower: true, strict: true, trim: true });

    const existing = await Technology.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Technology already exists" });
    }

    const tech = await Technology.create({
      name,
      slug,
      tag,
       description,
      logo: publicPath("technologies", logoFile),
      isActive: status === true || status === "true",
      adminId,
    });

    res.status(201).json({ success: true, message: "Technology added", data: tech });
  } catch (error) {
    console.error("ADD TECHNOLOGY ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL =================
exports.getAllTechnologies = async (req, res) => {
  try {
    const technologies = await Technology.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: technologies });
  } catch (error) {
    console.error("GET TECHNOLOGIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch technologies" });
  }
};

// ================= GET ALL ACTIVE (public) =================
exports.getActiveTechnologies = async (req, res) => {
  try {
    const technologies = await Technology
      .find({ isActive: true })
      .select("name slug logo")
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: technologies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch technologies" });
  }
};

// ================= GET BY ID =================
exports.getTechnologyById = async (req, res) => {
  try {
    const tech = await Technology.findById(req.params.id);
    if (!tech) return res.status(404).json({ message: "Technology not found" });

    res.status(200).json({ success: true, data: tech });
  } catch (error) {
    console.error("GET TECHNOLOGY ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch technology" });
  }
};

// ================= UPDATE =================
exports.updateTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    const tech = await Technology.findById(id);
    if (!tech) return res.status(404).json({ message: "Technology not found" });

    const logoFile = req.files?.["logo"]?.[0];
    const { name,description, status ,tag} = req.body;
    const trimmedName = name?.trim();

    // if name changed → regenerate slug and check uniqueness
    if (trimmedName && trimmedName !== tech.name) {
      const newSlug = slugify(trimmedName, { lower: true, strict: true, trim: true });
      const taken = await Technology.findOne({ slug: newSlug, _id: { $ne: id } });
      if (taken) return res.status(409).json({ message: "A technology with this name already exists" });
      tech.slug = newSlug;
      tech.name = trimmedName;
    }

    // new logo → remove old file
    if (logoFile) {
      removeFile(tech.logo);
      tech.logo = publicPath("technologies", logoFile);
    }
    if (description !== undefined) {
  tech.description = description.trim();
}

  if (tag !== undefined) {
  tech.tag = tag.trim();
}

    if (status !== undefined) tech.isActive = status === true || status === "true";

    await tech.save();

    res.status(200).json({ success: true, message: "Technology updated", data: tech });
  } catch (error) {
    console.error("UPDATE TECHNOLOGY ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleTechnologyStatus = async (req, res) => {
  try {
    const tech = await Technology.findById(req.params.id);
    if (!tech) return res.status(404).json({ message: "Technology not found" });

    tech.isActive = !tech.isActive;
    await tech.save();

    res.status(200).json({
      success: true,
      message: tech.isActive ? "Technology enabled" : "Technology disabled",
    });
  } catch (error) {
    console.error("TOGGLE TECHNOLOGY ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE =================
exports.deleteTechnology = async (req, res) => {
  try {
    const { id } = req.params;
    const tech = await Technology.findById(id);
    if (!tech) return res.status(404).json({ message: "Technology not found" });

    removeFile(tech.logo);
    await Technology.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Technology deleted" });
  } catch (error) {
    console.error("DELETE TECHNOLOGY ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleTechnologies = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No technologies selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const result = await Technology.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} technology(ies) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE TECHNOLOGIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteTechnologies = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No technologies selected" });
    }

    const technologies = await Technology.find({ _id: { $in: ids } })
      .select("_id logo")
      .lean();

    if (technologies.length === 0) {
      return res.status(404).json({ message: "No technologies found" });
    }

    for (const t of technologies) removeFile(t.logo);

    const result = await Technology.deleteMany({
      _id: { $in: technologies.map((t) => t._id) },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} technology(ies) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE TECHNOLOGIES ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= UPDATE ORDER ================= ⬅ NEW
exports.updateTechnologyOrder = async (req, res) => {
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

    await Technology.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE TECHNOLOGY ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};