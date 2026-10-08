// middleware/cvUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ensure the folder exists at boot: <project>/uploads/cv
const CV_DIR = path.join(__dirname, "..", "uploads", "cv");
fs.mkdirSync(CV_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CV_DIR),
  filename: (req, file, cb) => {
    // sanitize: keep only safe characters, prefix timestamp to avoid collisions
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

// matches the UI promise: "Formats accepted: pdf / doc / docx. Max 20Mb."
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "cv"));
  }
};

const cvUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// wraps multer so its errors become clean JSON responses instead of a 500 stack
const uploadCv = (req, res, next) => {
  cvUpload.single("cv")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "CV must be under 20 MB" });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(400)
          .json({ message: "Only PDF, DOC, or DOCX files are accepted" });
      }
      return res.status(400).json({ message: "CV upload failed" });
    }
    if (err) {
      console.error("CV upload error:", err);
      return res.status(500).json({ message: "CV upload failed" });
    }
    next();
  });
};

module.exports = uploadCv;