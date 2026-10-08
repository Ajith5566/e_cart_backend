// middleware/serviceImageUpload.js — built on the shared fileStorage utility
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "services",
  fields: [
    { name: "bannerImage" }, // top-level service
    { name: "heroImage" },
    { name: "og_image",      maxCount: 1 },   // ← ADD
    { name: "twitter_image", maxCount: 1 },   // ← ADD   // leaf service (reused as its own detail banner + parent's child-card thumbnail)
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});