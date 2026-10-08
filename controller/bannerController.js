// controller/bannerController.js — local disk + bulk actions
const Banner = require("../modal/bannerSchema");
const { publicPath, removeFile, removeFiles } = require("../utils/filestorage");
const mongoose = require("mongoose");

// ================= ADD BANNER =================
exports.addBanners = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const bannerFile = req.files?.["banner_image"]?.[0];
    const mobileFile = req.files?.["mobile_image"]?.[0];

    let { title, sub_title, button_text, url, status } = req.body;
    title = title?.trim();

    if (!title) {
      return res.status(400).json({ message: "Banner title is required" });
    }

    const existing = await Banner.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });
    if (existing) {
      // clean up any files multer already saved
      removeFiles(
        publicPath("banners", bannerFile),
        publicPath("banners", mobileFile)
      );
      return res.status(409).json({ message: "Banner already exists" });
    }

    const newBanner = await Banner.create({
      title,
      sub_title,
      button_text,
      url,
      isActive: status === true || status === "true",
      banner_image: publicPath("banners", bannerFile), // "/uploads/banners/<file>"
      mobile_image: publicPath("banners", mobileFile),
      adminId,
    });

    res.status(201).json({
      success: true,
      message: "Banner added successfully",
      data: newBanner,
    });
  } catch (error) {
    console.error("ADD BANNER ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL BANNERS =================
// ⬅ CHANGED — sort by displayOrder so saved drag order persists
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    console.error("GET BANNERS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
};

// ================= GET BANNER BY ID =================
exports.getbannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    console.error("GET BANNER ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch banner" });
  }
};

// ================= UPDATE BANNER =================
exports.updateBanners = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    const bannerFile = req.files?.["banner_image"]?.[0];
    const mobileFile = req.files?.["mobile_image"]?.[0];

    const { title, sub_title, button_text, url, status } = req.body;

    // ✅ new file → delete old disk file, store new path
    if (bannerFile) {
      removeFile(banner.banner_image);
      banner.banner_image = publicPath("banners", bannerFile);
    }

    if (mobileFile) {
      removeFile(banner.mobile_image);
      banner.mobile_image = publicPath("banners", mobileFile);
    }

    banner.title = title?.trim() ?? banner.title;
    banner.sub_title = sub_title ?? banner.sub_title;
    banner.button_text = button_text ?? banner.button_text;
    banner.url = url ?? banner.url;
    if (status !== undefined) {
      banner.isActive = status === true || status === "true";
    }

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("UPDATE BANNER ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE BANNER STATUS =================
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: banner.isActive ? "Banner enabled" : "Banner disabled",
    });
  } catch (error) {
    console.error("TOGGLE BANNER ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE BANNER =================
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    // ✅ remove both image files from disk before deleting the doc
    removeFiles(banner.banner_image, banner.mobile_image);

    await Banner.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    console.error("DELETE BANNER ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
// body: { ids: string[], isActive: boolean }
exports.bulkToggleBanners = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No banners selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const result = await Banner.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} banner(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE BANNERS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
// body: { ids: string[] }
// Banners own TWO image files each → fetch first, unlink both, then deleteMany.
exports.bulkDeleteBanners = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No banners selected" });
    }

    const banners = await Banner.find({ _id: { $in: ids } })
      .select("_id banner_image mobile_image")
      .lean();

    if (banners.length === 0) {
      return res.status(404).json({ message: "No banners found" });
    }

    // ✅ remove all image files before deleting documents
    for (const b of banners) {
      removeFiles(b.banner_image, b.mobile_image);
    }

    const result = await Banner.deleteMany({
      _id: { $in: banners.map((b) => b._id) },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} banner(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE BANNERS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= UPDATE ORDER ================= ⬅ NEW
exports.updateBannerOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { displayOrder } },
      },
    }));

    await Banner.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE BANNER ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};