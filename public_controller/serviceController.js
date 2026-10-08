// public_controller/serviceController.js
const Service   = require("../modal/serviceSchema");
const CaseStudy = require("../modal/caseStudySchema");
const Blog      = require("../modal/blogSchema");
const Meta      = require("../modal/metaSchema");
const imageUrl  = require("../utils/imageUrl");

// ── helper: apply imageUrl to a service list item ─────────────
const processService = (s) => ({
  ...s,
  bannerImage: imageUrl(s.bannerImage),
  heroImage:   imageUrl(s.heroImage),
});

// ── helper: apply imageUrl to children array ──────────────────
const processChildren = (children = []) =>
  children.map((c) => ({
    ...c,
    bannerImage: imageUrl(c.bannerImage),
    heroImage: imageUrl(c.heroImage),
  }));

// ================= GET ALL (listing page) =================
exports.getPublicServices = async (req, res) => {
  try {
    const all = await Service.find({ isActive: true })
      .select("title subTitle slug description bannerImage bullets shortDescription tagline heroImage parentService featured displayOrder")
      .sort({  displayOrder: 1})
      .lean();

    const parents  = all.filter((s) => !s.parentService);
    const children = all.filter((s) =>  s.parentService);

    const data = parents.map((parent) => ({
      ...processService(parent),
      children: children
        .filter((c) => c.parentService.toString() === parent._id.toString())
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((c) => ({ ...c, 
          bannerImage: imageUrl(c.bannerImage),
          heroImage: imageUrl(c.heroImage) })),
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET PUBLIC SERVICES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch services" });
  }
};

// ================= GET FEATURED (homepage) =================
exports.getFeaturedServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const services = await Service.find({
      isActive:      true,
      featured:      true,
      parentService: null,
    })
      .select("title subTitle slug description bannerImage bullets displayOrder")
      .sort({ displayOrder: 1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      data:    services.map((s) => ({ ...s, bannerImage: imageUrl(s.bannerImage) })),
    });
  } catch (error) {
    console.error("GET FEATURED SERVICES ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch featured services" });
  }
};

// ================= GET BY SLUG (detail page) =================
exports.getPublicServiceBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    const service = await Service.findOne({ slug, isActive: true })
      .populate("parentService",           "_id title subTitle slug")
      .populate("technologies.technology", "_id name slug logo")
      .populate("industries",              "_id name slug image") // ✅ populate industries
      .lean();

    if (!service) return res.status(404).json({ message: "Service not found" });

    // ── derived data ──────────────────────────────────────────

    // 1. related case studies
    const relatedCaseStudies = await CaseStudy.find({
      services: service._id,
      isActive: true,
    })
      .select("title slug bannerImage shortDescription")
      .limit(6)
      .lean();

    // 2. related services — siblings sharing the same parentService
    let relatedServices = [];
    if (service.parentService) {
      relatedServices = await Service.find({
        parentService: service.parentService._id ?? service.parentService,
        isActive:      true,
        _id:           { $ne: service._id },
      })
        .select("title slug shortDescription bannerImage heroImage displayOrder ")
        .sort({ displayOrder: 1 })
        .lean();
    }

    // 3. children (for top-level services)
    let children = [];
    if (!service.parentService) {
      children = await Service.find({
        parentService: service._id,
        isActive:      true,
      })
        .select("title slug subTitle shortDescription tagline heroImage displayOrder bannerImage")
        .sort({ displayOrder: 1 })
        .lean();
    }

    // 4. related blogs — blogs that include this service in their services[]
    //    also include blogs tagged to sibling services (under same parent)
    const serviceIdsForBlogs = [service._id];
    if (service.parentService) {
      // include siblings so blog listing is richer on leaf service pages
      const siblings = await Service.find({
        parentService: service.parentService._id ?? service.parentService,
        isActive:      true,
      }).select("_id").lean();
      siblings.forEach((s) => serviceIdsForBlogs.push(s._id));
    }

    const relatedBlogs = await Blog.find({
      services:          { $in: serviceIdsForBlogs },
      isActive:          true,
      publicationStatus: "published",
    })
      .select("title shortDescription image readTime publishedAt author services")
      .populate("author",   "_id name image")
      .populate("services", "_id title slug")
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean();

    // attach slug from Meta for each blog
    const blogIds  = relatedBlogs.map((b) => b._id);
    const blogMetas = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: blogIds },
    }).select("entity_id slug").lean();

    const blogMetaMap = blogMetas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    // 5. meta
    const meta = await Meta.findOne({
      entity_type: "service",
      entity_id:   service._id,
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...processService(service),

        // ✅ industries with image URLs
        industries: (service.industries ?? []).map((i) => ({
          ...i,
          image: imageUrl(i.image),
        })),

        // ✅ technology logos
        technologies: (service.technologies ?? []).map((t) => ({
          ...t,
          technology: t.technology ? {
            ...t.technology,
            logo: imageUrl(t.technology.logo),
          } : null,
        })),

        // ✅ children hero images
        children: processChildren(children),

        // ✅ related case study banners
        relatedCaseStudies: relatedCaseStudies.map((cs) => ({
          ...cs,
          bannerImage: imageUrl(cs.bannerImage),
        })),

        // ✅ related service hero images
        relatedServices: relatedServices.map((s) => ({
          ...s,
           bannerImage: imageUrl(s.bannerImage),
          heroImage: imageUrl(s.heroImage),
        })),

        // ✅ related blogs — includes sibling service blogs
        relatedBlogs: relatedBlogs.map((b) => ({
          ...b,
          image:  imageUrl(b.image),
          slug:   blogMetaMap[b._id.toString()] ?? "",
          author: b.author ? { ...b.author, image: imageUrl(b.author.image) } : null,
        })),

        // ✅ meta SEO images
        meta: meta ? {
          meta_title:          meta.meta_title,
          meta_description:    meta.meta_description,
          meta_keywords:       meta.meta_keywords,
          og_title:            meta.og_title,
          og_description:      meta.og_description,
          og_image:            imageUrl(meta.og_image),
          twitter_title:       meta.twitter_title,
          twitter_description: meta.twitter_description,
          twitter_image:       imageUrl(meta.twitter_image),
          canonical_url:       meta.canonical_url,
          allow_indexing:      meta.allow_indexing,
          schema_markup:       meta.schema_markup,
        } : {},
      },
    });
  } catch (error) {
    console.error("GET PUBLIC SERVICE BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};