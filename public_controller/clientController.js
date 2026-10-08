// public_controller/clientController.js
const Client = require("../modal/clientSchema");
const imageUrl = require("../utils/imageUrl");

exports.getPublicClients = async (req, res) => {
  try {
    const clients = await Client.find({ isActive: true })
      .select("name logo caseStudy")
      .populate({
        path: "caseStudy",
        select: "_id title slug bannerImage",
        match: { isActive: true }, // hide inactive case studies on the public site
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    // ✅ prefix images with full base URL
    const data = clients.map((c) => ({
      ...c,
      logo: imageUrl(c.logo),
      caseStudy: c.caseStudy
        ? {
            ...c.caseStudy,
            bannerImage: c.caseStudy.bannerImage ? imageUrl(c.caseStudy.bannerImage) : null,
          }
        : null,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PUBLIC CLIENTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
};


/* hai */