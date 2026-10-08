const Settings  = require("../modal/settingSchema");
const imageUrl  = require("../utils/imageUrl");

exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne()
      .select(
        "email phone address " +
        "facebook twitter linkedin instagram youtube " +
        "yearsOfExperience projectsCompleted clientSatisfaction expertTeamMembers countriesServed " +
        "bannerType bannerImage bannerVideoUrl" // ✅ ADD
      )
      .lean();

    if (!settings) return res.status(404).json({ message: "Settings not configured" });

    res.status(200).json({
      success: true,
      data: {
        ...settings,
        bannerImage: imageUrl(settings.bannerImage), // ✅ full URL
      },
    });
  } catch (error) {
    console.error("GET PUBLIC SETTINGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};