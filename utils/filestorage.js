// utils/fileStorage.js — shared local-disk file handling for ALL modules
// (blogs, banners, testimonials, CVs, product images, og/twitter images...)
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// single root for everything: <project>/uploads
/* const UPLOADS_ROOT = path.join(__dirname, "..", "uploads"); */

// Points directly to the public_html folder at your project root or hosting root
const UPLOADS_ROOT ="/home/u302045562/domains/uploads";

// ---------- mime presets ----------
const IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp","image/svg+xml"];
const DOC_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// ============================================================
// createUploader — factory that builds a ready-to-use middleware
//
//   const blogImageUpload = createUploader({
//     folder: "blogs",
//     fields: [{ name: "image" }, { name: "og_image" }, { name: "twitter_image" }],
//     allowedMime: IMAGE_MIME,
//     maxSizeMB: 2,
//   });
//
//   const cvUpload = createUploader({
//     folder: "cv",
//     single: "cv",            // single-file mode instead of fields
//     allowedMime: DOC_MIME,
//     maxSizeMB: 20,
//   });
// ============================================================
function createUploader({
  folder,
  fields,          // [{ name, maxCount? }] — multi-field mode
  single,          // "fieldname"          — single-file mode
  allowedMime = IMAGE_MIME,
  maxSizeMB = 2,
}) {
  const dir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    const field = fields?.find(f => f.name === file.fieldname);

    const uploadDir = field?.subfolder
        ? path.join(dir, field.subfolder)
        : dir;

    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
},
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `${Date.now()}-${safe}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMime.includes(file.mimetype)) cb(null, true);
    else cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });

  const handler = single
    ? upload.single(single)
    : upload.fields((fields || []).map((f) => ({ maxCount: 1, ...f })));

  const typeLabel = allowedMime === DOC_MIME ? "PDF, DOC, or DOCX" : "JPG, PNG,WebP   or SVG";

  // wrap so multer errors become clean JSON, uniformly across modules
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: `File must be under ${maxSizeMB} MB` });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ message: `Only ${typeLabel} files are accepted` });
        }
        return res.status(400).json({ message: "Upload failed" });
      }
      if (err) {
        console.error(`Upload error (${folder}):`, err);
        return res.status(500).json({ message: "Upload failed" });
      }
      next();
    });
  };
}

// ============================================================
// publicPath — DB value for an uploaded file
//   publicPath("blogs", req.files?.["image"]?.[0])  → "/uploads/blogs/1710-x.jpg"
//   publicPath("cv", req.file)                       → "/uploads/cv/1710-cv.pdf"
// Returns "" for missing files, so callers can pass results straight through.
// ============================================================
function publicPath(folder, file) {
  return file ? `/uploads/${folder}/${file.filename}` : "";
}

// ============================================================
// removeFile — delete a stored file by its public path (best-effort)
//   removeFile(blog.image)
//   removeFile(meta.og_image)
// Safe:
//  - ignores empty values and absolute URLs (old Cloudinary entries)
//  - path-traversal guard: refuses anything resolving outside /uploads
// ============================================================
function removeFile(publicPath) {
  if (!publicPath || /^https?:\/\//i.test(publicPath)) return; // skip Cloudinary-era URLs

  const relative = publicPath.replace(/^\/?uploads\//, "");
  const absolute = path.resolve(UPLOADS_ROOT, relative);

  // guard: never delete outside the uploads root
  if (!absolute.startsWith(UPLOADS_ROOT + path.sep)) {
    console.warn("removeFile blocked suspicious path:", publicPath);
    return;
  }

  fs.unlink(absolute, (err) => {
    if (err && err.code !== "ENOENT") {
      console.log("File delete error:", err.message);
    }
  });
}

// ============================================================
// removeFiles — convenience for several at once
//   removeFiles(blog.image, meta.og_image, meta.twitter_image)
// ============================================================
function removeFiles(...paths) {
  for (const p of paths) removeFile(p);
}

// ============================================================
// resolveStoredFile — absolute disk path for protected downloads
// (e.g. the CV download route). Same traversal guard.
// Returns null if outside the root or not provided.
// ============================================================
function resolveStoredFile(publicOrFilename, folder) {
  if (!publicOrFilename) return null;
  const relative = publicOrFilename.includes("/")
    ? publicOrFilename.replace(/^\/?uploads\//, "")
    : path.join(folder, publicOrFilename);
  const absolute = path.resolve(UPLOADS_ROOT, relative);
  if (!absolute.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return absolute;
}

module.exports = {
  UPLOADS_ROOT,
  IMAGE_MIME,
  DOC_MIME,
  createUploader,
  publicPath,
  removeFile,
  removeFiles,
  resolveStoredFile,
};