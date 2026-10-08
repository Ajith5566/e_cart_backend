// controller/faqController.js
const Faq = require("../modal/faqSchema");
const mongoose = require("mongoose");

const toBool = (val, fallback) => {
  if (val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  return val === "true";
};

// ================= ADD FAQ =================
exports.addFaq = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { question, answer, displayOrder, status } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }
    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const faq = await Faq.create({
      question: question.trim(),
      answer: answer.trim(),
      displayOrder: Number(displayOrder) || 0,
      isActive: toBool(status, true),
      adminId,
    });

    res.status(201).json({ success: true, message: "FAQ created", data: faq });
  } catch (error) {
    console.error("ADD FAQ ERROR:", error.message);
    res.status(500).json({ message: "FAQ creation failed" });
  }
};

// ================= GET ALL FAQS =================
exports.getAllFaqs = async (req, res) => {
  try {
    const filter = {};
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const faqs = await Faq.find(filter).sort({ displayOrder: 1, createdAt: -1 }).lean();

    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("GET ALL FAQS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};

// ================= GET FAQ BY ID =================
exports.getFaqById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid FAQ ID" });
    }

    const faq = await Faq.findById(id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    console.error("GET FAQ ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch FAQ" });
  }
};

// ================= UPDATE FAQ =================
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid FAQ ID" });
    }

    const faq = await Faq.findById(id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    if (req.permissionScope === "own" && faq.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own FAQs" });
    }

    const { question, answer, displayOrder, status } = req.body;

    if (question !== undefined) {
      if (!question.trim()) return res.status(400).json({ message: "Question is required" });
      faq.question = question.trim();
    }
    if (answer !== undefined) {
      if (!answer.trim()) return res.status(400).json({ message: "Answer is required" });
      faq.answer = answer.trim();
    }
    if (displayOrder !== undefined) faq.displayOrder = Number(displayOrder) || 0;
    if (status !== undefined) faq.isActive = toBool(status, faq.isActive);

    await faq.save();

    res.status(200).json({ success: true, message: "FAQ updated", data: faq });
  } catch (error) {
    console.error("UPDATE FAQ ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleFaqStatus = async (req, res) => {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    if (req.permissionScope === "own" && faq.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own FAQs" });
    }

    faq.isActive = !faq.isActive;
    await faq.save();

    res.status(200).json({ success: true, message: faq.isActive ? "FAQ enabled" : "FAQ disabled" });
  } catch (error) {
    console.error("TOGGLE FAQ ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE FAQ =================
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findById(id);
    if (!faq) return res.status(404).json({ message: "FAQ not found" });

    if (req.permissionScope === "own" && faq.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own FAQs" });
    }

    await Faq.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "FAQ deleted" });
  } catch (error) {
    console.error("DELETE FAQ ERROR:", error.message);
    res.status(500).json({ message: "FAQ delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleFaqs = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No FAQs selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Faq.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} FAQ(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE FAQS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteFaqs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No FAQs selected" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Faq.deleteMany(filter);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} FAQ(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE FAQS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= UPDATE ORDER =================
exports.updateFaqOrder = async (req, res) => {
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

    await Faq.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE FAQ ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};