const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "clients",
  fields: [
    { name: "logo" },
  ],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});

/*
  server.js:
  app.use("/uploads/clients", express.static(
    path.join(__dirname, "uploads", "clients"),
    { maxAge: "30d", immutable: true }
  ));
*/