// public_controller/caseStudyController.js
const CaseStudy = require("../modal/caseStudySchema");
const Meta      = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const imageUrl  = require("../utils/imageUrl");

// ── helper: apply imageUrl to a case study list item ─────────
const processListItem = (cs) => ({
  ...cs,
  bannerImage: imageUrl(cs.bannerImage),
  logo:        imageUrl(cs.logo),
   overviewImage:imageUrl(cs.overviewImage)
});

// ── helper: apply imageUrl to full case study detail ─────────
const processDetail = (cs, meta) => ({
  ...cs,
  bannerImage: imageUrl(cs.bannerImage),
  logo:        imageUrl(cs.logo),
   overviewImage:imageUrl(cs.overviewImage),
  gallery: (cs.gallery ?? []).map((item) => ({
    ...item,
    image: imageUrl(item.image),          // ✅ gallery { image, label }
  })),
  testimonial: cs.testimonial ? {
    ...cs.testimonial,
    thumbnail: imageUrl(cs.testimonial.thumbnail), // ✅ testimonial thumbnail
  } : null,
  relatedCaseStudies: (cs.relatedCaseStudies ?? []).map((r) => ({
    ...r,
    bannerImage: imageUrl(r.bannerImage), // ✅ related case study banners
  })),
  meta: meta ? {
    meta_title:          meta.meta_title,
    meta_description:    meta.meta_description,
    meta_keywords:       meta.meta_keywords,
    og_title:            meta.og_title,
    og_description:      meta.og_description,
    og_image:            imageUrl(meta.og_image),      // ✅ og image
    twitter_title:       meta.twitter_title,
    twitter_description: meta.twitter_description,
    twitter_image:       imageUrl(meta.twitter_image), // ✅ twitter image
    canonical_url:       meta.canonical_url,
    allow_indexing:      meta.allow_indexing,
    schema_markup:       meta.schema_markup,
  } : {},
});

// ================= GET ALL (listing page) =================
exports.getPublicCaseStudies = async (req, res) => {
  try {
    const { featured, industry, service, technology,solution, limit = 12, page = 1 } = req.query;

    const filter = { isActive: true };
    if (featured === "true") filter.featured  = true;
    if (industry)            filter.industry   = industry;
    if (service)             filter.services   = service;
    if (technology)          filter.technologies = technology;
     if (solution)            filter.solutions   = solution;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await CaseStudy.countDocuments(filter);

    const caseStudies = await CaseStudy.find(filter)
      .select("title slug shortDescription bannerImage logo featured  overviewImage industry services technologies solutions statistics displayOrder createdAt location")
      .populate("industry",     "_id name slug")
      .populate("services",     "_id title slug icon")
      .populate("technologies", "_id name slug logo")
      .populate("solutions", "_id name")
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const data = caseStudies.map((cs) => ({
      ...processListItem(cs),
      // also prefix technology logos
      technologies: (cs.technologies ?? []).map((t) => ({
        ...t,
        logo: imageUrl(t.logo),
      })),
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore:    skip + caseStudies.length < total,
      },
    });
  } catch (error) {
    console.error("GET PUBLIC CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch case studies" });
  }
};

// ================= GET FEATURED (homepage) =================
exports.getFeaturedCaseStudies = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const caseStudies = await CaseStudy.find({ isActive: true, featured: true })
      .select("title slug shortDescription bannerImage  overviewImage logo industry technologies services statistics displayOrder location")
      .populate("industry",  "_id name slug")
      .populate("services",  "_id title slug")
      .populate("technologies", "_id name slug logo")
      .sort({ displayOrder: 1 })
      .limit(Number(limit))
      .lean();

    const data = caseStudies.map(processListItem);

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET FEATURED CASE STUDIES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch featured case studies" });
  }
};

// ================= GET FILTERS =================
exports.getCaseStudyFilters = async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find({ isActive: true })
      .select("industry services technologies solutions")
      .populate("industry",      "_id name slug")
      .populate("services",      "_id title slug")
      .populate("technologies",  "_id name slug")
      .populate("solutions",     "_id name slug")
      .lean();

    const industryMap    = {};
    const serviceMap     = {};
    const technologyMap  = {};
    const solutionMap    = {};

    for (const cs of caseStudies) {
      if (cs.industry?._id) industryMap[cs.industry._id] = cs.industry;
      for (const s of cs.services     ?? []) if (s._id) serviceMap[s._id]    = s;
      for (const t of cs.technologies ?? []) if (t._id) technologyMap[t._id] = t;
      for (const s of cs.solutions    ?? []) if (s._id) solutionMap[s._id]   = s;
    }

    res.status(200).json({
      success: true,
      data: {
        industries:   Object.values(industryMap),
        services:     Object.values(serviceMap),
        technologies: Object.values(technologyMap),
        solutions:    Object.values(solutionMap),
      },
    });
  } catch (error) {
    console.error("GET CASE STUDY FILTERS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch filters" });
  }
};

// ================= GET BY SLUG (detail page) =================
exports.getPublicCaseStudyBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    const caseStudy = await CaseStudy.findOne({ slug, isActive: true })
      .populate("industry",           "_id name slug")
      .populate("services",           "_id title slug icon")
      .populate("technologies",       "_id name slug logo description")
      .populate("solutions",          "_id name slug")
      .populate("relatedCaseStudies", "_id title slug bannerImage shortDescription")
      .lean();

    if (caseStudy) {
      const meta = await Meta.findOne({
        entity_type: "casestudy",
        entity_id:   caseStudy._id,
      }).lean();

      return res.status(200).json({
        success: true,
        data: {
          ...processDetail(caseStudy, meta),
          // also prefix technology logos
          technologies: (caseStudy.technologies ?? []).map((t) => ({
            ...t,
            logo: imageUrl(t.logo),
          })),
        },
      });
    }

    // slug history fallback
    const history = await SlugHistory.findOne({
      old_slug:    slug,
      entity_type: "casestudy",
    });

    if (history) {
      const current = await CaseStudy.findById(history.entity_id).select("slug").lean();
      if (current?.slug) {
        return res.status(200).json({ redirect: true, newSlug: current.slug });
      }
    }

    return res.status(404).json({ message: "Case study not found" });
  } catch (error) {
    console.error("GET PUBLIC CASE STUDY BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /case-studies/:slug/adjacent
// returns { prev: { title, slug }, next: { title, slug } }
exports.getAdjacentCaseStudies = async (req, res) => {
  const slug = req.params.slug;
  
  // get current case study
  const current = await CaseStudy.findOne({ slug, isActive: true })
    .select("displayOrder").lean();
  
  if (!current) return res.status(404).json({ message: "Not found" });

  // get prev (lower displayOrder) and next (higher displayOrder)
  const [prev, next] = await Promise.all([
    CaseStudy.findOne({ 
      isActive: true, 
      displayOrder: { $lt: current.displayOrder } 
    })
      .select("title slug bannerImage")
      .sort({ displayOrder: -1 }) // closest lower
      .lean(),

    CaseStudy.findOne({ 
      isActive: true, 
      displayOrder: { $gt: current.displayOrder } 
    })
      .select("title slug bannerImage")
      .sort({ displayOrder: 1 }) // closest higher
      .lean(),
  ]);

  res.status(200).json({ success: true, data: { prev, next } });
};