const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../Config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "images",
    allowed_formats: ["png", "jpeg", "jpg", "webp", "avif"],
    public_id: (req, file) => {
      return "image-" + Date.now() + "-" + Math.round(Math.random() * 1e9);
    },
  },
});

const fileFilter = (req, file, callback) => {
  const allowedTypes = [
    "image/png", "image/jpeg", "image/jpg",
    "image/avif", "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed"), false);
  }
};

const multerconfig = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = multerconfig;