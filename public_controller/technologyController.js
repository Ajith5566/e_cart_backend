// ============================================================
// public_controller/technologyController.js
// ============================================================

const Technology = require("../modal/technologySchema");
const imageUrl = require("../utils/imageUrl");

// GET /technologies — all active technologies
exports.getPublicTechnologies = async (req, res) => {
  try {
    const technologies = await Technology.find({ isActive: true })
      .select("name slug logo description displayOrder tag")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

       const data = technologies.map((c) => ({
      ...c,
      logo: imageUrl(c.logo),
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PUBLIC TECHNOLOGIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch technologies" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const technologyController = require("../public_controller/technologyController");

router.get("/technologies",        technologyController.getPublicTechnologies);
router.get("/technologies/:slug",  technologyController.getPublicTechnologyBySlug);
*/