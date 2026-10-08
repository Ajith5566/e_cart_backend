const { createUploader, IMAGE_MIME } = require("../utils/filestorage");
 
module.exports = createUploader({
  folder:      "editor",
  fields:      [{ name: "image", maxCount: 10}],
  allowedMime: IMAGE_MIME,
  maxSizeMB:   5,
});