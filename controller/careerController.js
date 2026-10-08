// controller/careerController.js
const CareerApplication = require("../modal/careerAppicationSchema");
const sendEmail = require("../utils/mailer");
const path = require("path");
const fs = require("fs");
const { verifyCaptcha } = require("../utils/verifyCaptcha");
const Settings = require("../modal/settingSchema"); // ajust path to your model

const CV_DIR = path.join(__dirname, "..", "uploads", "cv");

// prevent HTML injection into the notification emails
const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ================= SUBMIT APPLICATION (public) =================
// expects multipart/form-data:
//   fields: name, email, phone, jobTitle
//   file:   cv  (handled by uploadCv middleware before this runs)

exports.submitApplication = async (req, res) => {
  try {
    const { name, email, phone, jobTitle, jobId ,recaptchaToken} = req.body;

    if (!name || !email || !phone || !jobTitle) {
      return res.status(400).json({ message: "All fields are required" });
    }
      // ✅ verify captcha with action name
           const captcha = await verifyCaptcha(recaptchaToken, "job_apply");
          if (!captcha.success) {
            return res.status(400).json({ message: captcha.error || "CAPTCHA verification failed" });
          }
     

    if (!req.file) {
      return res.status(400).json({ message: "CV is required" });
    }

    // duplicate guard: same email + same job within the same day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const duplicate = await CareerApplication.findOne({
      email: email.toLowerCase().trim(),
      jobTitle: jobTitle.trim(),
      createdAt: { $gte: startOfDay },
    });
    if (duplicate) {
      // remove the file that multer already saved for this rejected attempt
      fs.unlink(path.join(CV_DIR, req.file.filename), () => {});
      return res.status(409).json({
        message: "You have already applied for this position today",
      });
    }

    const application = await CareerApplication.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      jobTitle: jobTitle.trim(),
      jobId:    jobId || null,  // ✅
      cvUrl: req.file.filename, // just the filename; folder is fixed
      cvFileName: req.file.originalname,
    });

    const safeName = escapeHtml(name);
    const safeJob = escapeHtml(jobTitle);

    // link the HR team clicks to download the CV (protected route)
    const serverUrl = process.env.SERVER_URL || "http://localhost:4000";
    const cvLink = `${serverUrl}/careers/${application._id}/cv`;

    // ── Email 1: confirmation to the applicant ──────────────────────
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e8e8e5;">
          <h2 style="margin: 0 0 8px; color: #1a1a2e;">Application received</h2>
          <p style="color: #6b6e80; margin: 0 0 24px; font-size: 15px;">
            Hi ${safeName}, thanks for applying for the <strong>${safeJob}</strong> role.
            Our team will review your application and get back to you.
          </p>
          <p style="color: #6b6e80; font-size: 14px; margin: 0 0 4px;">
            Questions? Reach us at:
          </p>
          <p style="color: #1a1a2e; font-size: 14px; font-weight: 600; margin: 0;">
            info@phitany.com &nbsp;·&nbsp; (+91) 77360 78808
          </p>
          <hr style="border: none; border-top: 1px solid #e8e8e5; margin: 24px 0;" />
          <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
            Phitany Business Solutions
          </p>
        </div>
      </div>
    `;

    // ── Email 2: notification to the hiring team ────────────────────
    const teamHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e8e8e5;">
          <h2 style="margin: 0 0 4px; color: #1a1a2e;">New job application</h2>
          <p style="color: #9b9b9b; font-size: 13px; margin: 0 0 24px;">
            ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; width: 120px; border-bottom: 1px solid #f1f1f1;">Position</td>
              <td style="padding: 10px 0; color: #1a1a2e; font-weight: 600; border-bottom: 1px solid #f1f1f1;">${safeJob}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; border-bottom: 1px solid #f1f1f1;">Name</td>
              <td style="padding: 10px 0; color: #1a1a2e; font-weight: 600; border-bottom: 1px solid #f1f1f1;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; border-bottom: 1px solid #f1f1f1;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1;">
                <a href="mailto:${escapeHtml(email)}" style="color: #185fa5; text-decoration: none;">${escapeHtml(email)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; border-bottom: 1px solid #f1f1f1;">Phone</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1;">
                <a href="tel:${escapeHtml(phone)}" style="color: #185fa5; text-decoration: none;">${escapeHtml(phone)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80;">CV</td>
              <td style="padding: 10px 0;">
                <a href="${cvLink}" style="color: #185fa5;">Download CV (${escapeHtml(application.cvFileName)})</a>
              </td>
            </tr>
          </table>

          <p style="color: #b0b0b0; font-size: 12px; margin: 16px 0 0;">
            The download link requires admin login.
          </p>
        </div>
      </div>
    `;

    // fire both emails concurrently; don't block the response
       let teamEmail = process.env.HR_EMAIL || process.env.TEAM_EMAIL || process.env.EMAIL_USER;
    try {
      const settings = await Settings.findOne().select("email").lean();
      if (settings?.email) {
        teamEmail = settings.email;
      }
    } catch (settingsErr) {
      console.error("Failed to fetch settings email, using fallback:", settingsErr);
    }

    Promise.all([
      sendEmail(email, `Application received — ${jobTitle} at Phitany`, "", userHtml),
      sendEmail(teamEmail, `New application: ${jobTitle} — ${name}`, "", teamHtml),
    ]).catch((err) => console.error("Career email error:", err));

    res.status(201).json({
      success: true,
      message: "Application submitted. We'll be in touch soon.",
      id: application._id,
    });
  } catch (error) {
    console.error("CAREER SUBMIT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL APPLICATIONS (admin) =================

exports.getAllApplications = async (req, res) => {
  try {
    // optional filters: ?status=new&jobTitle=Frontend Developer
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.jobTitle) filter.jobTitle = req.query.jobTitle;

    const applications = await CareerApplication.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

// ================= GET APPLICATION BY ID (admin) =================

exports.getApplicationById = async (req, res) => {
  try {
    const application = await CareerApplication.findByIdAndUpdate(
      req.params.id,
      { isRead: true }, // viewing marks it read
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

// ================= DOWNLOAD CV (admin, protected) =================
// CVs are personal documents — never serve the uploads/cv folder with
// express.static, or anyone could download applicants' resumes.

exports.downloadCv = async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id);

    if (!application || !application.cvUrl) {
      return res.status(404).json({ message: "CV not found" });
    }

    const filePath = path.join(CV_DIR, application.cvUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "CV file missing on server" });
    }

    // sends with the original filename so the admin sees "vivek_resume.pdf"
    res.download(filePath, application.cvFileName || "cv.pdf");
  } catch (error) {
    console.error("CV DOWNLOAD ERROR:", error);
    res.status(500).json({ message: "Download failed" });
  }
};

// ================= UPDATE STATUS (admin) =================

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
 
    if (!["new", "shortlisted", "rejected", "hired"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
 
    // reason is mandatory for every status change
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "A reason is required" });
    }
 
    const application = await CareerApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        // append to the trail instead of overwriting — full audit history
        $push: {
          statusHistory: {
            status,
            reason: reason.trim(),
            changedAt: new Date(),
          },
        },
      },
      { new: true }
    );
 
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
 
    res.status(200).json({ success: true, data: application });
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
}

// ================= DELETE APPLICATION (admin) =================

exports.deleteApplication = async (req, res) => {
  try {
    const application = await CareerApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // remove the CV file from disk
    if (application.cvUrl) {
      const filePath = path.join(CV_DIR, application.cvUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.log("CV file delete error:", err.message);
      });
    }

    await CareerApplication.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Application deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};


exports.bulkDeleteApplications = async (req, res) => {
  try {
    const { ids } = req.body;
 
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No applications selected" });
    }
 
    // fetch first so we know which CV files to remove
    const applications = await CareerApplication.find({ _id: { $in: ids } })
      .select("_id cvUrl")
      .lean();
 
    if (applications.length === 0) {
      return res.status(404).json({ message: "No applications found" });
    }
 
    // unlink each CV (best-effort; a missing file shouldn't block the delete)
    for (const app of applications) {
      if (app.cvUrl) {
        const filePath = path.join(CV_DIR, app.cvUrl);
        fs.unlink(filePath, (err) => {
          if (err) console.log("CV file delete error:", err.message);
        });
      }
    }
 
    const result = await CareerApplication.deleteMany({
      _id: { $in: applications.map((a) => a._id) },
    });
 
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} application(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE APPLICATIONS ERROR:", error);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};