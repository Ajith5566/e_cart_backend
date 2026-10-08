// public_controller/solutionController.js
const Solution  = require("../modal/solutionSchema");
const CaseStudy = require("../modal/caseStudySchema");
const imageUrl  = require("../utils/imageUrl");

// ── helper: apply imageUrl to a solution ─────────────────────
const processSolution = (s) => ({
  ...s,
  image:     imageUrl(s.image),
  keyPoints: (s.keyPoints ?? []).map((kp) => ({
    ...kp,
    icon: imageUrl(kp.icon), // ✅ each keyPoint icon
  })),
  relatedCaseStudies: (s.relatedCaseStudies ?? []).map((cs) => ({
    ...cs,
    bannerImage: imageUrl(cs.bannerImage), // ✅ related case study banners
  })),
});

// ================= GET ALL ACTIVE SOLUTIONS =================
// GET /solutions
exports.getPublicSolutions = async (req, res) => {
  try {
    const solutions = await Solution.find({ isActive: true })
      .select("name shortDescription image keyPoints relatedCaseStudies displayOrder")
      .populate("relatedCaseStudies", "_id title slug bannerImage shortDescription")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const data = solutions.map(processSolution);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PUBLIC SOLUTIONS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch solutions" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const solutionController = require("../public_controller/solutionController");

router.get("/solutions", solutionController.getPublicSolutions);
*/