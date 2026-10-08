const Settings   = require("../modal/settingSchema");
const imageUrl   = require("../utils/imageUrl");
const { publicPath, removeFile } = require("../utils/filestorage");

// ================= SAVE SETTINGS =================
exports.saveSettings = async (req, res) => {
  try {
    const {
      email, phone, address,
      facebook, twitter, linkedin, instagram, youtube,
      yearsOfExperience, projectsCompleted, clientSatisfaction,
      expertTeamMembers, countriesServed,
      bannerVideoUrl, removeBannerImage, removeBannerVideo,
    } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required" });
    }

    const bannerImageFile = req.files?.bannerImage?.[0];
    const existing        = await Settings.findOne();

    // ── banner state from existing ────────────────────────────
    const bannerType      = req.body.bannerType ?? existing?.bannerType ?? "none";
    let bannerImage       = existing?.bannerImage    ?? "";
    let bannerVideoUrlVal = existing?.bannerVideoUrl ?? "";

    // ── image — independent ───────────────────────────────────
    if (removeBannerImage === "true") {
      removeFile(bannerImage);
      bannerImage = "";
    }
    if (bannerImageFile) {
      if (bannerImage) removeFile(bannerImage);
      bannerImage = publicPath("settings", bannerImageFile);
    }

    // ── video — independent ───────────────────────────────────
    if (removeBannerVideo === "true") {
      bannerVideoUrlVal = "";
    }
    if (bannerVideoUrl && bannerVideoUrl.trim()) {
      bannerVideoUrlVal = bannerVideoUrl.trim();
    }

    const result = await Settings.findOneAndUpdate(
      {},
      {
        email, phone, address,
        facebook, twitter, linkedin, instagram, youtube,
        yearsOfExperience, projectsCompleted,
        clientSatisfaction, expertTeamMembers, countriesServed,
        bannerType,
        bannerImage,
        bannerVideoUrl: bannerVideoUrlVal,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("SETTINGS SAVE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET SETTINGS =================
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne().lean();
    if (!settings) return res.status(404).json({ message: "Settings not configured" });

    res.status(200).json({
      success: true,
      data: {
        ...settings,
        bannerImage: imageUrl(settings.bannerImage),
      },
    });
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};