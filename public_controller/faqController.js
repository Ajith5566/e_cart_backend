// ============================================================
// public_controller/faqController.js
// ============================================================

const Faq = require("../modal/faqSchema");

// GET /faqs — active FAQs only (for careers page + any public page)
exports.getPublicFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find({ isActive: true })
      .select("question answer")
      .sort({ displayOrder: 1,createdAt: 1 }) // oldest first — keeps FAQ order consistent
      .lean();

    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("GET PUBLIC FAQS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch FAQs" });
  }
};