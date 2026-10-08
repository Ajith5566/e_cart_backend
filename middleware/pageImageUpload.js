const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "pages",
  fields: [
    { name: "og_image",       maxCount: 1 },
    { name: "twitter_image",  maxCount: 1 },
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB:   2,
});