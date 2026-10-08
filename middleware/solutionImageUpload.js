// middleware/solutionImageUpload.js — built on the shared fileStorage utility
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "solutions",
  fields: [
    { name: "image" },                          // hero image
    { name: "keyPointIcons", maxCount: 20 },    // per-key-point icons, consumed in order
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});