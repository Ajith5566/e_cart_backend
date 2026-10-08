// ============================================================
// public_controller/jobController.js
// ============================================================

const Job = require("../modal/jobSchema");

// GET /jobs — all active job listings
// optional ?type=Full time|Part time|Contract|Internship|Remote
exports.getPublicJobs = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { isActive: true };
    if (type) filter.jobType = type;

    const jobs = await Job.find(filter)
      .select("title skills experience jobType location description createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    console.error("GET PUBLIC JOBS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

// GET /jobs/:id — single job detail
exports.getPublicJobById = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, isActive: true })
      .select("title skills experience jobType location description createdAt")
      .lean();

    if (!job) return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("GET PUBLIC JOB ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch job" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const jobController = require("../public_controller/jobController");

router.get("/jobs",     jobController.getPublicJobs);
router.get("/jobs/:id", jobController.getPublicJobById);
*/