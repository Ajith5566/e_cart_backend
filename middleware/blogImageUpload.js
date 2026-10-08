// middleware/blogImageUpload.js — built on the shared fileStorage utility
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "blogs",
  fields: [
    { name: "image" },
    { name: "og_image" },
    { name: "twitter_image" },
    { name: "blockGalleryImages", maxCount: 50 }, // ✅ NEW — gallery content blocks
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});