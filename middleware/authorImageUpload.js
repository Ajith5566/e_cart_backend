// middleware/authorImageUpload.js
const { createUploader, IMAGE_MIME } = require("../utils/filestorage");

module.exports = createUploader({
  folder: "authors",
  fields: [{ name: "image" }],
  allowedMime: IMAGE_MIME,
  maxSizeMB: 2,
});

/*
  server.js — add this mount alongside /uploads/blogs and /uploads/banners:
  app.use("/uploads/authors", express.static(
    path.join(__dirname, "uploads", "authors"),
    { maxAge: "30d", immutable: true }
  ));

  router.js — replace SingleImageFields on author routes with authorImageUpload:
  const authorImageUpload = require("../middleware/authorImageUpload");
  router.post("/author",               jwtMiddleware, checkPermission("author","create"), authorImageUpload, authorController.addAuthor);
  router.put("/admin/updateAuthor/:id", jwtMiddleware, checkPermission("author","update"), authorImageUpload, authorController.updateauthors);
*/