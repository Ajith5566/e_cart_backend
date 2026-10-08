const { createUploader, IMAGE_MIME } = require("../utils/filestorage");
 
module.exports = createUploader({
  folder: "testimonials",
  fields: [{ name: "image" }],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});