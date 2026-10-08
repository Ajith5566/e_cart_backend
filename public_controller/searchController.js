// public_controller/searchController.js
const CaseStudy  = require("../modal/caseStudySchema");
const Service    = require("../modal/serviceSchema");
const Industry   = require("../modal/industrySchema");
const Solution   = require("../modal/solutionSchema");
const Blog       = require("../modal/blogSchema");
const Technology = require("../modal/technologySchema");
const Page = require("../modal/pageSchema");
const Meta       = require("../modal/metaSchema");
const imageUrl   = require("../utils/imageUrl");

exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Query must be at least 2 characters" });
    }

    const regex = new RegExp(q.trim(), "i");

    const [caseStudies, services, industries, solutions, technologies, blogs, pages] = await Promise.all([
      CaseStudy.find({
        isActive: true,
        $or: [{ title: regex }, { shortDescription: regex }],
      })
        .select("title slug shortDescription bannerImage industry")
        .populate("industry", "name")
        .limit(5)
        .lean(),

      Service.find({
        isActive: true,
        $or: [{ title: regex }, { shortDescription: regex }, { description: regex }],
      })
        .select("title slug shortDescription heroImage bannerImage parentService")
        .populate("parentService", "title slug")
        .limit(5)
        .lean(),

      Industry.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }],
      })
        .select("name slug description image")
        .limit(5)
        .lean(),

      Solution.find({
        isActive: true,
        $or: [{ name: regex }, { shortDescription: regex }],
      })
        .select("name slug shortDescription image")
        .limit(5)
        .lean(),

      Technology.find({
        isActive: true,
        $or: [{ name: regex }, { description: regex }],
      })
        .select("name slug description logo")
        .limit(5)
        .lean(),

      Blog.find({
        isActive: true,
        publicationStatus: "published",
        $or: [{ title: regex }, { shortDescription: regex }],
      })
        .select("title shortDescription image")
        .limit(5)
        .lean(),

        // add to Promise.all
Page.find({
  isActive: true,
  $or: [{ title: regex }, { shortDescription: regex }],
})
  .select("title slug shortDescription")
  .limit(5)
  .lean(),
    ]);

    // attach slugs to blogs from Meta
    const blogIds   = blogs.map((b) => b._id);
    const blogMetas = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: blogIds },
    }).select("entity_id slug").lean();
    const blogMetaMap = blogMetas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    // ── format to match SearchIndexItem shape ─────────────────
    const results = [
      ...caseStudies.map((cs) => ({
        name:     cs.title,
        category: "Case Study",
        tag:      cs.industry?.name ?? "",
        href:     `/case-studies/${cs.slug}`,
        image:    imageUrl(cs.bannerImage),
      })),

      ...services.map((s) => ({
        name:     s.title,
        category: "Service",
        tag:      s.parentService?.title ?? "", // parent service name as tag
        href:     `/services/${s.slug}`,
        image:    imageUrl(s.heroImage || s.bannerImage),
      })),

      ...industries.map((i) => ({
        name:     i.name,
        category: "Industry",
        tag:      "",
        href:     `/industries`,
        image:    imageUrl(i.image),
      })),

      ...solutions.map((s) => ({
        name:     s.name,
        category: "Solution",
        tag:      "",
        href:     `/solutions`,
        image:    imageUrl(s.image),
      })),

      ...technologies.map((t) => ({
        name:     t.name,
        category: "Technology",
        tag:      "",
        href:     `/technologies`,
        image:    imageUrl(t.logo),
      })),

      ...blogs.map((b) => ({
        name:     b.title,
        category: "Blog",
        tag:      "",
        href:     `/insights/${blogMetaMap[b._id.toString()] ?? ""}`,
        image:    imageUrl(b.image),
      })),

      ...pages.map((p) => ({
  name:     p.title,
  category: "Page",
  tag:      "",
  href:     `/${p.slug}`,
  image:    "",  // pages have no image
})),
    ];

    res.status(200).json({
      success: true,
      query:   q.trim(),
      total:   results.length,
      data:    results,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error.message);
    res.status(500).json({ message: "Search failed" });
  }
};

//demo