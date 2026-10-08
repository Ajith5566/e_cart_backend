const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "settings",
  fields: [
    { name: "bannerImage", maxCount: 1 },
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB:   5,
});