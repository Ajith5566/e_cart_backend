// controllers/product.controller.js
const products = require("../modal/productSchema");
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");   // ✅ was missing — getProductBySlug crashed without it
const { archiveSlugIfChanged } = require("../utils/slugHelper"); // ✅ new
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require("../Config/cloudinary");

// ================= ADD PRODUCT =================

exports.addproject = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const productFiles    = req.files?.["images"]         || [];
    const ogImageFiles    = req.files?.["og_image"]       || [];
    const twitterFiles    = req.files?.["twitter_image"]  || [];

    if (productFiles.length === 0) {
      return res.status(400).json({ message: "Images are required" });
    }

    const imageUrls       = productFiles.map(file => file.path);
    const ogImageUrl      = ogImageFiles[0]?.path  || "";
    const twitterImageUrl = twitterFiles[0]?.path  || "";

    const {
      name, price, quantity, description,
      shortDescription, status, category, meta
    } = req.body;

    if (!name || !price || !quantity || !description || !shortDescription) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingProduct = await products.findOne({ productName: name.trim() });
    if (existingProduct) {
      return res.status(409).json({ message: "Product already added" });
    }

    const newProduct = new products({
      productName: name.trim(),
      price,
      quantity,
      shortDescription,
      description,
      images: imageUrls,
      adminId,
      isActive: status,
      category
    });

    await newProduct.save();

    if (meta) {
      const parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;
      if (Object.keys(parsedMeta).length > 0) {
        if (ogImageUrl)      parsedMeta.og_image      = ogImageUrl;
        if (twitterImageUrl) parsedMeta.twitter_image = twitterImageUrl;

        // ✅ normalize the slug on create too
        if (parsedMeta.slug) {
          parsedMeta.slug = parsedMeta.slug.toLowerCase().trim();
        }

        await Meta.findOneAndUpdate(
          { entity_type: "Products", entity_id: newProduct._id },
          { ...parsedMeta, entity_type: "Products", entity_id: newProduct._id },
          { new: true, upsert: true }
        );
      }
    }

    res.status(201).json({ message: "Product created successfully", product: newProduct });

  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};


// ================= GET ALL PRODUCTS =================

exports.getAllproducts = async (req, res) => {
  try {
    let filter = {};

    if (req.permissionScope === "own") {
      filter.adminId = req.adminId;
    }

    const allProducts = await products.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .lean();

    const productIds = allProducts.map(p => p._id);

    const allMetas = await Meta.find({
      entity_type: "Products",
      entity_id: { $in: productIds }
    }).lean();

    const metaMap = allMetas.reduce((acc, meta) => {
      acc[meta.entity_id.toString()] = meta;
      return acc;
    }, {});

    const productsWithMeta = allProducts.map(product => ({
      ...product,
      meta: metaMap[product._id.toString()] || {}
    }));

    res.status(200).json(productsWithMeta);

  } catch (err) {
    console.error("GET ALL PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};


// ================= DELETE PRODUCT =================

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await products.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.permissionScope === "own" && product.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own products" });
    }

    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          const publicId = img.split("/").slice(-2).join("/").split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.log("Cloudinary delete error:", err);
        }
      }
    }

    await products.findByIdAndDelete(id);

    await Meta.findOneAndDelete({
      entity_type: "Products",
      entity_id: id
    });

    // ✅ clean up slug history for the deleted product
    // (old links to a deleted product should 404, not redirect to nothing)
    await SlugHistory.deleteMany({
      entity_type: "Products",
      entity_id: id
    });

    res.status(200).json({ message: "Product deleted successfully" });

  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};


// ================= UPDATE PRODUCT =================

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name, price, quantity, description,
      shortDescription, existingImages, status, category, meta
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await products.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.permissionScope === "own" && product.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own products" });
    }

    const productFiles    = req.files?.["images"]        || [];
    const ogImageFiles    = req.files?.["og_image"]      || [];
    const twitterFiles    = req.files?.["twitter_image"] || [];

    const ogImageUrl      = ogImageFiles[0]?.path  || "";
    const twitterImageUrl = twitterFiles[0]?.path  || "";

    let finalImages = [];
    if (existingImages) {
      finalImages = JSON.parse(existingImages);
    }
    if (productFiles.length > 0) {
      const newImages = productFiles.map(file => file.path);
      finalImages = [...finalImages, ...newImages];
    }

    const removedImages = product.images.filter(
      img => !finalImages.includes(img)
    );

    removedImages.forEach(img => {
      const imagePath = path.join(__dirname, "..", "uploads", img);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    });

    product.productName      = name;
    product.price            = price;
    product.quantity         = quantity;
    product.description      = description;
    product.shortDescription = shortDescription;
    product.images           = finalImages;
    product.category         = category;
    product.isActive         = status;

    await product.save();

    if (meta) {
      const parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;
      if (Object.keys(parsedMeta).length > 0) {
        if (ogImageUrl)      parsedMeta.og_image      = ogImageUrl;
        if (twitterImageUrl) parsedMeta.twitter_image = twitterImageUrl;

        if (parsedMeta.slug) {
          parsedMeta.slug = parsedMeta.slug.toLowerCase().trim();
        }

        // ✅ THE FIX — archive the old slug BEFORE overwriting the meta.
        // This is why history was never saved: this controller writes meta
        // directly and was bypassing the saveMeta endpoint entirely.
        await archiveSlugIfChanged("Products", id, parsedMeta.slug);

        await Meta.findOneAndUpdate(
          { entity_type: "Products", entity_id: id },
          { ...parsedMeta, entity_type: "Products", entity_id: id },
          { new: true, upsert: true }
        );
      }
    }

    res.status(200).json({ message: "Product updated successfully", product });

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};


// ================= GET PRODUCT BY ID (with meta) =================

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await products.findById(id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.permissionScope === "own" && product.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only view your own products" });
    }

    const meta = await Meta.findOne({
      entity_type: "Products",
      entity_id: id
    });

    res.status(200).json({
      ...product.toObject(),
      meta: meta || {}
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};


// ================= TOGGLE PRODUCT STATUS =================

exports.toggleProductstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const ProductData = await products.findById(id);

    if (!ProductData) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (req.permissionScope === "own" && ProductData.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own products" });
    }

    ProductData.isActive = !ProductData.isActive;
    await ProductData.save();

    res.status(200).json({
      message: ProductData.isActive ? "Product enabled" : "Product disabled",
    });

  } catch (error) {
    console.error("TOGGLE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Toggle failed" });
  }
};


// ================= GET PRODUCT BY SLUG (with history redirect) =================

exports.getProductBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();
    console.log("Requested slug:", slug);

    // ---------- 1. Try the CURRENT slug (Meta table) ----------
    const meta = await Meta.findOne({ slug, entity_type: "Products" });

    if (meta) {
      const product = await products.findOne({
        _id: meta.entity_id,
        isActive: true,
      });

      console.log("Meta found:", meta.slug);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.status(200).json({ product, meta });
    }

    console.log("Checking slug history...");

    // ---------- 2. Fallback: check slug HISTORY ----------
    const history = await SlugHistory.findOne({
      old_slug: slug,
      entity_type: "Products",
    });
    console.log("History:", history ? history.old_slug : null);

    if (history) {
      const currentMeta = await Meta.findOne({
        entity_type: "Products",
        entity_id: history.entity_id,
      });

      if (currentMeta && currentMeta.slug) {
        // ✅ 200 — NOT 301.
        // This endpoint is a JSON API called by fetch() in the browser.
        // A 3xx status makes the browser hijack the response before your
        // frontend code can read the JSON body, so `data.redirect` never
        // runs and the page shows "Product not found".
        // The client performs the actual redirect via router.replace().
       return res.status(200).json({
  redirect: true,
  newSlug: currentMeta.slug,
  permanent: true,
});
      }
    }

    // ---------- 3. Nothing found ----------
    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};