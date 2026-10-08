// ============================================================
// public_controller/careerController.js
// ============================================================

const CareerApplication = require("../modal/careerAppicationSchema");
const path              = require("path");
const fs                = require("fs");
const { verifyCaptcha } = require("../utils/verifyCaptcha");

// Basic email/phone sanity checks — not exhaustive, just enough
// to stop obvious junk from being stored.
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9+\-\s()]{7,15}$/.test(phone);

// Remove a file multer already saved to disk, e.g. when we reject
// the submission after the upload has already happened.
const cleanupUploadedFile = (cvFile) => {
  if (!cvFile?.path) return;
  fs.unlink(cvFile.path, (err) => {
    if (err) console.error("CV cleanup error:", err.message);
  });
};

// POST /careers/apply — submit a job application with CV upload
exports.submitApplication = async (req, res) => {
  const cvFile = req.files?.["cv"]?.[0] || req.file;

  try {
    const { name, email, phone, jobTitle ,jobId,recaptchaToken} = req.body;
      // ✅ verify captcha with action name
  const captcha = await verifyCaptcha(recaptchaToken, "contact_form");
  if (!captcha.success) {
    return res.status(400).json({ message: captcha.error || "CAPTCHA verification failed" });
  }

    // ── validation ────────────────────────────────────────────
    if (!name?.trim()) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email?.trim()) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isValidEmail(email.trim())) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    if (!phone?.trim()) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Phone is required" });
    }
    if (!isValidPhone(phone.trim())) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Please provide a valid phone number" });
    }
    if (!jobTitle?.trim()) {
      cleanupUploadedFile(cvFile);
      return res.status(400).json({ message: "Job title is required" });
    }
    if (!cvFile) {
      return res.status(400).json({ message: "CV is required" });
    }

    // ── duplicate check ──────────────────────────────────────
    // Note: this findOne + create is not atomic — under concurrent
    // requests (double-click, retry) two applications could still
    // slip through. For a hard guarantee, add a unique compound
    // index on { email, jobTitle } in the schema and catch the
    // duplicate-key error (code 11000) below.
    const existing = await CareerApplication.findOne({
      email:    email.trim().toLowerCase(),
      jobTitle: jobTitle.trim(),
    });

    if (existing) {
      cleanupUploadedFile(cvFile);
      return res.status(409).json({
        message: "You have already applied for this position",
      });
    }

    let application;
    try {
      application = await CareerApplication.create({
        name:        name.trim(),
        email:       email.trim().toLowerCase(),
        phone:       phone.trim(),
        jobTitle:    jobTitle.trim(),
        jobId:jobId,
        // store ONLY the filename — downloadCv() does
        // path.join(CV_DIR, application.cvUrl), so a full/relative
        // path here (cvFile.path) would double up the folder and
        // 404 on download.
        cvUrl:       cvFile.filename,
        cvFileName:  cvFile.originalname || "",
        status:      "new",
        statusHistory: [{
          status:    "new",
          reason:    "Application submitted",
          changedAt: new Date(),
        }],
        isRead: false,
      });
    } catch (dbError) {
      // if a unique index on {email, jobTitle} is added later,
      // a race-condition duplicate will land here as code 11000
      if (dbError.code === 11000) {
        cleanupUploadedFile(cvFile);
        return res.status(409).json({
          message: "You have already applied for this position",
        });
      }
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully. We will get back to you soon.",
      data: {
        _id:      application._id,
        name:     application.name,
        email:    application.email,
        jobTitle: application.jobTitle,
      },
    });
  } catch (error) {
    console.error("SUBMIT APPLICATION ERROR:", error.message);
    // best-effort cleanup so a server error doesn't leave an
    // orphaned file with no DB record behind it
    cleanupUploadedFile(cvFile);
    res.status(500).json({ message: "Failed to submit application" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const careerController = require("../public_controller/careerController");

// uses existing cv upload middleware
const { cvUpload } = require("../middleware/cvUpload"); // or whatever your cv middleware is named

router.post("/careers/apply", cvUpload.single("cv"), careerController.submitApplication);
*/