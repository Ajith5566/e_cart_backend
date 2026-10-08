// middleware/bannerImageUpload.js
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "banners",
  fields: [
    { name: "banner_image" },
    { name: "mobile_image" },
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});

/*
  server.js — add this mount alongside /uploads/blogs:
  app.use("/uploads/banners", express.static(
    path.join(__dirname, "uploads", "banners"),
    { maxAge: "30d", immutable: true }
  ));
*/