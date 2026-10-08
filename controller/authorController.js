// controller/authorController.js
const Author = require("../modal/blog_authorSchema");
const { publicPath, removeFile } = require("../utils/filestorage");

// ================= ADD AUTHOR =================
exports.addAuthor = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const imageFile = req.files?.["image"]?.[0];

    let { name, description, tagline, linkedin, facebook, instagram, youtube, twitter, status } = req.body;
    name = name?.trim();

    if (!name) {
      return res.status(400).json({ message: "Author name is required" });
    }

    const existing = await Author.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({ message: "Author already exists" });
    }

    const newAuthor = await Author.create({
      name,
      tagline,
      description,
      linkedin,
      instagram,
      facebook,
      youtube,
      twitter,
      isActive: status === true || status === "true",
      image: publicPath("authors", imageFile), // "/uploads/authors/<file>"
      adminId,
    });

    res.status(201).json({
      success: true,
      message: "Author added successfully",
      data: newAuthor,
    });
  } catch (error) {
    console.error("ADD AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL AUTHORS =================
exports.getAllauthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: authors });
  } catch (error) {
    console.error("GET AUTHORS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch authors" });
  }
};

// ================= GET AUTHOR BY ID =================
exports.getAuthorById = async (req, res) => {
  try {
    const authorData = await Author.findById(req.params.id);
    if (!authorData) return res.status(404).json({ message: "Author not found" });

    res.status(200).json({ success: true, data: authorData });
  } catch (error) {
    console.error("GET AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch author" });
  }
};

// ================= UPDATE AUTHOR =================
exports.updateauthors = async (req, res) => {
  try {
    const { id } = req.params;
    const authorData = await Author.findById(id);
    if (!authorData) return res.status(404).json({ message: "Author not found" });

    const imageFile = req.files?.["image"]?.[0];

    const { name, description, tagline, linkedin, facebook, instagram, youtube, twitter, status } = req.body;

    // ✅ new image → delete old file from disk, store new path
    if (imageFile) {
      removeFile(authorData.image);
      authorData.image = publicPath("authors", imageFile);
    }

    authorData.name = name?.trim() ?? authorData.name;
    authorData.tagline = tagline ?? authorData.tagline;
    authorData.description = description ?? authorData.description;
    authorData.linkedin = linkedin ?? authorData.linkedin;
    authorData.instagram = instagram ?? authorData.instagram;
    authorData.facebook = facebook ?? authorData.facebook;
    authorData.youtube = youtube ?? authorData.youtube;
    authorData.twitter = twitter ?? authorData.twitter; // ✅ twitter
    if (status !== undefined) {
      authorData.isActive = status === true || status === "true";
    }

    await authorData.save();

    res.status(200).json({
      success: true,
      message: "Author updated successfully",
      data: authorData,
    });
  } catch (error) {
    console.error("UPDATE AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE AUTHOR STATUS =================
exports.toggleauthorStatus = async (req, res) => {
  try {
    const authorData = await Author.findById(req.params.id);
    if (!authorData) return res.status(404).json({ message: "Author not found" });

    authorData.isActive = !authorData.isActive;
    await authorData.save();

    res.status(200).json({
      success: true,
      message: authorData.isActive ? "Author enabled" : "Author disabled",
    });
  } catch (error) {
    console.error("TOGGLE AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE AUTHOR =================
exports.deleteauthor = async (req, res) => {
  try {
    const { id } = req.params;
    const authorData = await Author.findById(id);
    if (!authorData) return res.status(404).json({ message: "Author not found" });

    // ✅ remove image file from disk
    removeFile(authorData.image);

    await Author.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Author deleted successfully" });
  } catch (error) {
    console.error("DELETE AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
// body: { ids: string[], isActive: boolean }
exports.bulkToggleAuthors = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No authors selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const result = await Author.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} author(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE AUTHORS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
// body: { ids: string[] }
// Authors own an image file — fetch first, unlink, then deleteMany.
exports.bulkDeleteAuthors = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No authors selected" });
    }

    const authors = await Author.find({ _id: { $in: ids } })
      .select("_id image")
      .lean();

    if (authors.length === 0) {
      return res.status(404).json({ message: "No authors found" });
    }

    // ✅ remove each image file before deleting documents
    for (const a of authors) removeFile(a.image);

    const result = await Author.deleteMany({
      _id: { $in: authors.map((a) => a._id) },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} author(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE AUTHORS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};