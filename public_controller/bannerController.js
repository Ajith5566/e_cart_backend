// ============================================================
// public_controller/bannerController.js
// ============================================================

const Banner = require("../modal/bannerSchema");
const imageUrl = require("../utils/imageUrl");

// GET /banners — all active banners sorted by displayOrder
exports.getPublicBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .select("title sub_title button_text url banner_image mobile_image displayOrder")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

       // ✅ prefix logo with full base URL
          const data = banners.map((c) => ({
            ...c,
            banner_image: imageUrl(c.banner_image),
            mobile_image: imageUrl(c.mobile_image),
          }));

    res.status(200).json({ success: true,  data });
  } catch (error) {
    console.error("GET PUBLIC BANNERS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch banners" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const bannerController = require("../public_controller/bannerController");

router.get("/banners", bannerController.getPublicBanners);
*/