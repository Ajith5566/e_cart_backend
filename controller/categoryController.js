const category = require("../modal/categorySchema");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary");
const Meta = require("../modal/metaSchema");


// ── helper: check if childId is ancestor of parentId ────
const isDescendant = async (childId, parentId) => {
  let current = parentId;
  while (current) {
    const parent = await category.findById(current);
    if (!parent) break;
    if (String(parent._id) === String(childId)) return true;
    current = parent.parent_category;
  }
  return false;
};


// ================= ADD CATEGORY =================

exports.addCategory = async (req, res) => {
  try {

    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ using .fields() — all files come through req.files object
    const categoryImageFiles = req.files?.["image"]         || [];
    const ogImageFiles       = req.files?.["og_image"]      || [];
    const twitterFiles       = req.files?.["twitter_image"] || [];

    const ogImageUrl      = ogImageFiles[0]?.path  || "";
    const twitterImageUrl = twitterFiles[0]?.path  || "";

    let { name, description, parentCategory, status, shortDescription, meta } = req.body;

    name = name?.trim();

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
      return res.status(400).json({ message: "Invalid parent category" });
    }

    const existingCategory = await category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });

    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists" });
    }

    // ✅ was req.file — now req.files["image"][0] because we use .fields()
    const imagePath = categoryImageFiles[0]?.path || "";

    // Step 1 — save category
    const newCategory = new category({
      name,
      shortDescription,
      description,
      parent_category: parentCategory || null,
      isActive:        status === true || status === "true",
      image:           imagePath,
      adminId,
    });

    await newCategory.save();

    // Step 2 — save meta
    if (meta) {
      const parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;

      if (Object.keys(parsedMeta).length > 0) {
        if (ogImageUrl)      parsedMeta.og_image      = ogImageUrl;
        if (twitterImageUrl) parsedMeta.twitter_image = twitterImageUrl;

        await Meta.findOneAndUpdate(
          { entity_type: "category", entity_id: newCategory._id },
          {
            $set: {
              ...parsedMeta,
              entity_type: "category",
              entity_id:   newCategory._id
            }
          },
          { new: true, upsert: true }
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data:    newCategory
    });

  } catch (error) {
    console.error("ADD CATEGORY ERROR:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};


// ================= GET ALL CATEGORIES =================

exports.getAllCategories = async (req, res) => {
  try {

    const categories = await category
      .find()
      .populate("parent_category", "name")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ attach meta to each category — same pattern as products
    const categoryIds = categories.map(c => c._id);

    const allMetas = await Meta.find({
      entity_type: "category",
      entity_id:   { $in: categoryIds }
    }).lean();

    const metaMap = allMetas.reduce((acc, meta) => {
      acc[meta.entity_id.toString()] = meta;
      return acc;
    }, {});

    const categoriesWithMeta = categories.map(cat => ({
      ...cat,
      meta: metaMap[cat._id.toString()] || {}
    }));

    res.status(200).json({
      success: true,
      count:   categoriesWithMeta.length,
      data:    categoriesWithMeta
    });

  } catch (err) {
    console.error("GET CATEGORIES ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};


// ================= TOGGLE CATEGORY STATUS =================

exports.toggleCategoryStatus = async (req, res) => {
  try {

    const { id } = req.params;
    const categoryData = await category.findById(id);

    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }

    categoryData.isActive = !categoryData.isActive;
    await categoryData.save();

    res.status(200).json({
      message: categoryData.isActive ? "Category enabled" : "Category disabled"
    });

  } catch (error) {
    console.error("TOGGLE CATEGORY ERROR:", error);
    res.status(500).json({ message: "Toggle failed" });
  }
};


// ================= UPDATE CATEGORY =================

exports.updateCategory = async (req, res) => {
  try {

    const { id } = req.params;

    // ✅ all files come through req.files object
    const categoryImageFiles = req.files?.["image"]         || [];
    const ogImageFiles       = req.files?.["og_image"]      || [];
    const twitterFiles       = req.files?.["twitter_image"] || [];

    const ogImageUrl      = ogImageFiles[0]?.path  || "";
    const twitterImageUrl = twitterFiles[0]?.path  || "";

    let { name, description, existingImage, status,shortDescription, parentCategory, meta } = req.body;

    const categoryData = await category.findById(id);

    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!parentCategory) parentCategory = null;

    if (parentCategory && !mongoose.Types.ObjectId.isValid(parentCategory)) {
      return res.status(400).json({ message: "Invalid parent category" });
    }

    if (parentCategory === id) {
      return res.status(400).json({ message: "Category cannot be its own parent" });
    }

    // ── handle category main image ────────────────────────
    // ✅ fixed
let finalImage = categoryData.image; // default: keep current

if (categoryImageFiles.length > 0) {
  // new image uploaded — delete old, use new
  if (categoryData.image) {
    const publicId = categoryData.image
      .split("/").slice(-2).join("/").split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  }
  finalImage = categoryImageFiles[0].path;

} else if (existingImage === "") {
  // image explicitly removed, no replacement uploaded
  if (categoryData.image) {
    const publicId = categoryData.image
      .split("/").slice(-2).join("/").split(".")[0];
    await cloudinary.uploader.destroy(publicId);
  }
  finalImage = "";

} else if (existingImage) {
  // unchanged — kept existing image
  finalImage = existingImage;
}

    // ── update category fields ────────────────────────────
    categoryData.name            = name?.trim();
    categoryData.description     = description;
    categoryData.image           = finalImage;
    categoryData.isActive        = status === true || status === "true";
    categoryData.parent_category = parentCategory;
    categoryData.shortDescription =shortDescription;

    await categoryData.save();

    // ── upsert meta ───────────────────────────────────────
    if (meta) {
      const parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;

      if (Object.keys(parsedMeta).length > 0) {

        // only overwrite image if new file uploaded
        if (ogImageUrl)      parsedMeta.og_image      = ogImageUrl;
        if (twitterImageUrl) parsedMeta.twitter_image = twitterImageUrl;

        await Meta.findOneAndUpdate(
          { entity_type: "category", entity_id: id },
          {
            $set: {                       // ✅ $set — don't wipe untouched fields
              ...parsedMeta,
              entity_type: "category",
              entity_id:   id
            }
          },
          { new: true, upsert: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};


// ================= GET CATEGORY BY ID (with meta) =================

exports.getCategoryById = async (req, res) => {
  try {

    const { id } = req.params;
    const categoryData = await category.findById(id)
      .populate("parent_category", "name");

    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }

    const meta = await Meta.findOne({
      entity_type: "category",
      entity_id:   id
    });

    res.status(200).json({
      success: true,
      data: {
        ...categoryData.toObject(),
        meta: meta || {}
      }
    });

  } catch (error) {
    console.error("GET CATEGORY ERROR:", error);
    res.status(500).json({ message: "Failed to fetch category" });
  }
};


// ================= DELETE CATEGORY =================

exports.deleteCategory = async (req, res) => {
  try {

    const { id } = req.params;

    const categoryData = await category.findById(id);

    if (!categoryData) {
      return res.status(404).json({ message: "Category not found" });
    }

    // delete image from cloudinary
    if (categoryData.image) {
      const publicId = categoryData.image
        .split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    await category.findOneAndDelete({ _id: id, adminId: req.adminId });

    // ✅ delete meta too — no orphan records
    await Meta.findOneAndDelete({
      entity_type: "category",
      entity_id:   id
    });

    res.status(200).json({ message: "Category deleted successfully" });

  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};