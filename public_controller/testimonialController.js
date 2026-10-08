const Testimonial = require("../modal/testimonialSchema");
const imageUrl = require("../utils/imageUrl");
 
exports.getPublicTestimonials = async (req, res) => {
  try {
    const { type, service, industry } = req.query;
 
    const filter = { isActive: true };
    if (type     === "text"  ) filter.type     = "text";
    if (type     === "video" ) filter.type     = "video";
    if (service  )             filter.services  = service;
    if (industry )             filter.industry  = industry;
 
    const testimonials = await Testimonial.find(filter)
      .select("type name designation company image message url videoUrl quote services industry heading")
      .populate("services", "_id title slug")
      .populate("industry", "_id name slug")
      .sort({ displayOrder: 1 })
      .lean();

        const data = testimonials.map((c) => ({
          ...c,
          image: imageUrl(c.image),
        }));

    res.status(200).json({ success: true, data});
  } catch (error) {
    console.error("GET PUBLIC TESTIMONIALS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch testimonials" });
  }
};