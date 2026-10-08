// public_controller/industryController.js
const Industry = require("../modal/industrySchema");
const imageUrl = require("../utils/imageUrl");

// GET /industries — all active industries
exports.getPublicIndustries = async (req, res) => {
  try {
    const industries = await Industry.find({ isActive: true })
      .select("name slug description image")
      .sort({ createdAt: -1 })
      .lean();

    const data = industries.map((i) => ({
      ...i,
      image: imageUrl(i.image), // ✅ prefix image
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PUBLIC INDUSTRIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch industries" });
  }
};

// GET /industries/:slug — single industry detail
/* exports.getPublicIndustryBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    const industry = await Industry.findOne({ slug, isActive: true })
      .select("name slug description image")
      .lean();

    if (!industry) return res.status(404).json({ message: "Industry not found" });

    res.status(200).json({
      success: true,
      data: {
        ...industry,
        image: imageUrl(industry.image), // ✅ prefix image
      },
    });
  } catch (error) {
    console.error("GET PUBLIC INDUSTRY BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
 */

// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const industryController = require("../public_controller/industryController");

router.get("/industries",        industryController.getPublicIndustries);
router.get("/industries/:slug",  industryController.getPublicIndustryBySlug);
*/