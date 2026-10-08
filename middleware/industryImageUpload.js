const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "industries",
  fields: [{ name: "image" }],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});

/*
  server.js:
  app.use("/uploads/industries", express.static(
    path.join(__dirname, "uploads", "industries"),
    { maxAge: "30d", immutable: true }
  ));
*/