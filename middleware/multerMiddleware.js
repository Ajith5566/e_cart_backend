const multer = require("multer");
const path = require("path");

// Storage
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./uploads");
  },
  filename: (req, file, callback) => {
    const uniqueName = `image-${Date.now()}${path.extname(
      file.originalname
    )}`;
    callback(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/avif" ||
    file.mimetype === "image/webp"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed"), false);
  }
};

// Multer config
const multerconfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

module.exports = multerconfig;
