// middleware/technologyLogoUpload.js
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "technologies",
  fields: [{ name: "logo" }],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 1, // logos are small
});

/*
  server.js — add static mount:
  app.use("/uploads/technologies", express.static(
    path.join(__dirname, "uploads", "technologies"),
    { maxAge: "30d", immutable: true }
  ));
*/