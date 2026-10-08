// controller/jobController.js
const Job = require("../modal/jobSchema");
const mongoose = require("mongoose");

// ================= GET ACTIVE JOBS (public — careers page) =================

exports.getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true ,isSystem:false})
      .sort({ createdAt: -1 })
      .select("-adminId") // public page doesn't need internal fields
      .lean();

    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

// ================= ADD JOB (admin) =================

exports.addJob = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, skills, experience, jobType, location, description, isActive } = req.body;

    if (!title || !experience || !location || !description) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existing = await Job.findOne({ title: title.trim(), isActive: true });
    if (existing) {
      return res.status(409).json({ message: "An active job with this title already exists" });
    }

    const job = await Job.create({
      title: title.trim(),
      skills: Array.isArray(skills) ? skills : [],
      experience: experience.trim(),
      jobType,
      location: location.trim(),
      description,
      isActive: isActive !== undefined ? isActive : true,
      adminId,
    });

    res.status(201).json({ success: true, message: "Job posted", data: job });
  } catch (error) {
    console.error("ADD JOB ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL JOBS (admin) =================

exports.getAllJobs = async (req, res) => {
  try {
    let filter = { isSystem: { $ne: true },};
    if (req.permissionScope === "own") {
      filter.adminId = req.adminId;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};


exports.getAllJobsfilter = async (req, res) => {
  try {
    let filter = {};
    if (req.permissionScope === "own") {
      filter.adminId = req.adminId;
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

// ================= GET JOB BY ID (admin) =================

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.permissionScope === "own" && job.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only view your own jobs" });
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job" });
  }
};

// ================= UPDATE JOB (admin) =================

exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.permissionScope === "own" && job.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own jobs" });
    }

    const { title, skills, experience, jobType, location, description, isActive } = req.body;

    job.title = title ?? job.title;
    job.skills = Array.isArray(skills) ? skills : job.skills;
    job.experience = experience ?? job.experience;
    job.jobType = jobType ?? job.jobType;
    job.location = location ?? job.location;
    job.description = description ?? job.description;
    if (isActive !== undefined) job.isActive = isActive;

    await job.save();

    res.status(200).json({ success: true, message: "Job updated", data: job });
  } catch (error) {
    console.error("UPDATE JOB ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE JOB STATUS (admin) =================
// open ↔ closed; closed jobs disappear from the public page but
// keep their applications intact

exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.permissionScope === "own" && job.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own jobs" });
    }

    job.isActive = !job.isActive;
    await job.save();

    res.status(200).json({
      success: true,
      message: job.isActive ? "Job opened" : "Job closed",
    });
  } catch (error) {
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE JOB (admin) =================

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (req.permissionScope === "own" && job.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own jobs" });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};


// ================= ROUTES — add to your router file =================
/*
const jobController = require("../controller/jobController");

// PUBLIC — feeds the careers page
router.get("/jobs/active", jobController.getActiveJobs);

// ADMIN
router.post("/jobs",            verifyToken, checkPermission("jobs","create"), jobController.addJob);
router.get("/jobs",             verifyToken, checkPermission("jobs","view"),   jobController.getAllJobs);
router.get("/jobs/:id",         verifyToken, checkPermission("jobs","view"),   jobController.getJobById);
router.put("/jobs/:id",         verifyToken, checkPermission("jobs","edit"),   jobController.updateJob);
router.patch("/jobs/:id/toggle",verifyToken, checkPermission("jobs","edit"),   jobController.toggleJobStatus);
router.delete("/jobs/:id",      verifyToken, checkPermission("jobs","delete"), jobController.deleteJob);
*/
// ============================================================
// BACKEND — bulk actions for jobs
// ============================================================

// ---------- controller/jobController.js — ADD ----------

// ================= BULK STATUS (admin) =================
// body: { ids: string[], isActive: boolean }
// used for "inactive selected / all" and "activate selected / all"
exports.bulkToggleJobs = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No jobs selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    // scope: "own" admins can only touch their own jobs
    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") {
      filter.adminId = req.adminId;
    }

    const result = await Job.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} job(s) ${isActive ? "opened" : "closed"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE JOBS ERROR:", error);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE (admin) =================
// body: { ids: string[] }
exports.bulkDeleteJobs = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No jobs selected" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") {
      filter.adminId = req.adminId;
    }

    const result = await Job.deleteMany(filter);

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} job(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE JOBS ERROR:", error);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};


// ---------- routes — ADD ----------
/*

*/
// NOTE: register these BEFORE "/jobs/:id" routes, otherwise Express
// matches "bulk-status" / "bulk-delete" as an :id and you get a
// "Invalid job ID" error.


// ---------- services/allAPi.ts — ADD ----------
/*

*/