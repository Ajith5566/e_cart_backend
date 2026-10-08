// controller/testmonialController.js — updated with services + industry
const Testimonial = require("../modal/testimonialSchema");
const { publicPath, removeFile } = require("../utils/filestorage");

// ================= ADD TESTIMONIAL =================
exports.addTestimonials = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const imageFile = req.files?.["image"]?.[0];

    let { type, name, designation, company, message, status, url, videoUrl, quote, industry ,heading} = req.body;
    name = name?.trim();
    type = type === "video" ? "video" : "text";

    if (!name) return res.status(400).json({ message: "Name is required" });
    if (type === "text"  && !message?.trim()) return res.status(400).json({ message: "Message is required for text testimonials" });
    if (type === "video" && !videoUrl?.trim()) return res.status(400).json({ message: "Video URL is required for video testimonials" });

    const existing = await Testimonial.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) return res.status(409).json({ message: "Testimonial already exists" });

    // services comes as JSON array string from FormData
    let services = [];
    try { services = req.body.services ? JSON.parse(req.body.services) : []; } catch { services = []; }

    const newTestimonial = await Testimonial.create({
      type,
      name,
      designation: designation || "",
      company:     company     || "",
      message:     message     || "",
       heading:     heading     || "",
      url:         url         || "",
      videoUrl:    videoUrl    || "",
      quote:       quote       || "",
      services,
      industry:    industry    || null,
      isActive:    status === true || status === "true",
      image:       publicPath("testimonials", imageFile),
      adminId,
    });

    res.status(201).json({ success: true, message: "Testimonial added successfully", data: newTestimonial });
  } catch (error) {
    console.error("ADD TESTIMONIAL ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL TESTIMONIALS =================
exports.getAlltestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .populate("services",  "_id title slug")
      .populate("industry",  "_id name slug")
      .sort({ displayOrder: 1 })
      .lean();
    res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    console.error("GET TESTIMONIALS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
};

// ================= GET TESTIMONIAL BY ID =================
exports.getTestimonialbyId = async (req, res) => {
  try {
    const testimonialData = await Testimonial.findById(req.params.id)
      .populate("services", "_id title slug")
      .populate("industry", "_id name slug");
    if (!testimonialData) return res.status(404).json({ message: "Testimonial not found" });
    res.status(200).json({ success: true, data: testimonialData });
  } catch (error) {
    console.error("GET TESTIMONIAL ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch testimonial" });
  }
};

// ================= UPDATE TESTIMONIAL =================
exports.updatetestimonials = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonialData = await Testimonial.findById(id);
    if (!testimonialData) return res.status(404).json({ message: "Testimonial not found" });

    const imageFile = req.files?.["image"]?.[0];
    const { name, designation, company, message, status, url, videoUrl, quote, industry,heading} = req.body;

    if (imageFile) { removeFile(testimonialData.image); testimonialData.image = publicPath("testimonials", imageFile); }

    // services
    if (req.body.services !== undefined) {
      try { testimonialData.services = JSON.parse(req.body.services); } catch { testimonialData.services = []; }
    }

    if (name        !== undefined) testimonialData.name        = name.trim();
    if (designation !== undefined) testimonialData.designation = designation;
    if (company     !== undefined) testimonialData.company     = company;
    if (message     !== undefined) testimonialData.message     = message;
     if (heading     !== undefined) testimonialData.heading     = heading;
    if (url         !== undefined) testimonialData.url         = url;
    if (videoUrl    !== undefined) testimonialData.videoUrl    = videoUrl;
    if (quote       !== undefined) testimonialData.quote       = quote;
    if (industry    !== undefined) testimonialData.industry    = industry || null;
    if (status      !== undefined) testimonialData.isActive    = status === true || status === "true";

    await testimonialData.save();
    res.status(200).json({ success: true, message: "Testimonial updated successfully" });
  } catch (error) {
    console.error("UPDATE TESTIMONIAL ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggletestimonialsStatus = async (req, res) => {
  try {
    const testimonialData = await Testimonial.findById(req.params.id);
    if (!testimonialData) return res.status(404).json({ message: "Testimonial not found" });
    testimonialData.isActive = !testimonialData.isActive;
    await testimonialData.save();
    res.status(200).json({ success: true, message: testimonialData.isActive ? "Testimonial enabled" : "Testimonial disabled" });
  } catch (error) {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE TESTIMONIAL =================
exports.deletetestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const testimonialData = await Testimonial.findById(id);
    if (!testimonialData) return res.status(404).json({ message: "Testimonial not found" });
    removeFile(testimonialData.image);
    await Testimonial.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("DELETE TESTIMONIAL ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleTestimonials = async (req, res) => {
  try {
    const { ids, isActive } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No testimonials selected" });
    if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be true or false" });
    const result = await Testimonial.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
    res.status(200).json({ success: true, message: `${result.modifiedCount} testimonial(s) ${isActive ? "activated" : "deactivated"}`, modified: result.modifiedCount });
  } catch (error) {
    console.error("BULK TOGGLE TESTIMONIALS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteTestimonials = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: "No testimonials selected" });
    const testimonials = await Testimonial.find({ _id: { $in: ids } }).select("_id image").lean();
    if (testimonials.length === 0) return res.status(404).json({ message: "No testimonials found" });
    for (const t of testimonials) removeFile(t.image);
    const result = await Testimonial.deleteMany({ _id: { $in: testimonials.map((t) => t._id) } });
    res.status(200).json({ success: true, message: `${result.deletedCount} testimonial(s) deleted`, deleted: result.deletedCount });
  } catch (error) {
    console.error("BULK DELETE TESTIMONIALS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= UPDATE ORDER =================
exports.updateTestimonialsOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const filter = req.permissionScope === "own" ? { adminId: req.adminId } : {};

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id, ...filter },
        update: { $set: { displayOrder } },
      },
    }));

    await Testimonial.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE FAQ ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};