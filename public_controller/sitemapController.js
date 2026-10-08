// public_controller/sitemapController.js
const CaseStudy  = require("../modal/caseStudySchema");
const Service    = require("../modal/serviceSchema");
const Blog       = require("../modal/blogSchema");
const Page       = require("../modal/pageSchema");
const Meta       = require("../modal/metaSchema");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://frontend.phitanydev.in";

// ── helper: build a <url> block ───────────────────────────────
const urlBlock = (loc, lastmod, changefreq = "monthly", priority = "0.7") => `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

// ── GET /sitemap.xml ──────────────────────────────────────────
exports.getSitemapXml = async (req, res) => {
  try {
    const [caseStudies, services, blogs, pages] = await Promise.all([
      CaseStudy.find({ isActive: true })
        .select("slug updatedAt")
        .lean(),

      Service.find({ isActive: true })
        .select("slug parentService updatedAt")
        .lean(),

      Blog.find({ isActive: true, publicationStatus: "published" })
        .select("_id publishedAt updatedAt")
        .lean(),

      Page.find({ isActive: true })
        .select("slug updatedAt")
        .lean(),
    ]);

    // attach blog slugs from Meta
    const blogIds   = blogs.map((b) => b._id);
    const blogMetas = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: blogIds },
    }).select("entity_id slug").lean();

    const blogMetaMap = blogMetas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    // ── static pages ──────────────────────────────────────────
    const staticUrls = [
      urlBlock(`${FRONTEND_URL}`,              null, "weekly",  "1.0"),
      urlBlock(`${FRONTEND_URL}/about`,        null, "monthly", "0.8"),
      urlBlock(`${FRONTEND_URL}/services`,     null, "weekly",  "0.9"),
      urlBlock(`${FRONTEND_URL}/case-studies`, null, "weekly",  "0.9"),
      urlBlock(`${FRONTEND_URL}/careers`,      null, "weekly",  "0.7"),
      urlBlock(`${FRONTEND_URL}/contact`,      null, "monthly", "0.7"),
      urlBlock(`${FRONTEND_URL}/insights`,     null, "daily",   "0.8"),
      urlBlock(`${FRONTEND_URL}/solutions`,    null, "monthly", "0.7"),
    ].join("");

    // ── case studies ──────────────────────────────────────────
    const caseStudyUrls = caseStudies
      .map((cs) => urlBlock(`${FRONTEND_URL}/case-studies/${cs.slug}`, cs.updatedAt, "monthly", "0.8"))
      .join("");

    // ── services — parent and child ───────────────────────────
    const serviceUrls = services
      .map((s) => urlBlock(`${FRONTEND_URL}/services/${s.slug}`, s.updatedAt, "monthly", s.parentService ? "0.7" : "0.8"))
      .join("");

    // ── blogs ─────────────────────────────────────────────────
    const blogUrls = blogs
      .filter((b) => blogMetaMap[b._id.toString()])
      .map((b) => urlBlock(
        `${FRONTEND_URL}/insights/${blogMetaMap[b._id.toString()]}`,
        b.updatedAt || b.publishedAt,
        "weekly",
        "0.7"
      ))
      .join("");

    // ── pages (privacy policy, terms etc.) ───────────────────
    const pageUrls = pages
      .map((p) => urlBlock(`${FRONTEND_URL}/pages/${p.slug}`, p.updatedAt, "yearly", "0.5"))
      .join("");

    // ── assemble XML ──────────────────────────────────────────
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${caseStudyUrls}
${serviceUrls}
${blogUrls}
${pageUrls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
    res.status(200).send(xml);

  } catch (error) {
    console.error("SITEMAP ERROR:", error.message);
    res.status(500).json({ message: "Failed to generate sitemap" });
  }
};

// ── GET /sitemap (JSON version for API docs) ──────────────────
exports.getSitemapJson = async (req, res) => {
  try {
    const [caseStudies, services, blogs, industries, pages] = await Promise.all([
      CaseStudy.find({ isActive: true }).select("slug updatedAt").lean(),
      Service.find({ isActive: true }).select("slug parentService updatedAt").lean(),
      Blog.find({ isActive: true, publicationStatus: "published" }).select("_id publishedAt updatedAt").lean(),
      Page.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);

    const blogIds   = blogs.map((b) => b._id);
    const blogMetas = await Meta.find({ entity_type: "blog", entity_id: { $in: blogIds } })
      .select("entity_id slug").lean();
    const blogMetaMap = blogMetas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    const urls = [
      // static
      { url: `${FRONTEND_URL}`,              type: "static",      changefreq: "weekly",  priority: 1.0 },
      { url: `${FRONTEND_URL}/about`,        type: "static",      changefreq: "monthly", priority: 0.8 },
      { url: `${FRONTEND_URL}/services`,     type: "static",      changefreq: "weekly",  priority: 0.9 },
      { url: `${FRONTEND_URL}/case-studies`, type: "static",      changefreq: "weekly",  priority: 0.9 },
      { url: `${FRONTEND_URL}/careers`,      type: "static",      changefreq: "weekly",  priority: 0.7 },
      { url: `${FRONTEND_URL}/contact`,      type: "static",      changefreq: "monthly", priority: 0.7 },
      { url: `${FRONTEND_URL}/insights`,     type: "static",      changefreq: "daily",   priority: 0.8 },
      { url: `${FRONTEND_URL}/solutions`,    type: "static",      changefreq: "monthly", priority: 0.7 },

      // case studies
      ...caseStudies.map((cs) => ({
        url:        `${FRONTEND_URL}/case-studies/${cs.slug}`,
        type:       "case-study",
        lastmod:    cs.updatedAt,
        changefreq: "monthly",
        priority:   0.8,
      })),

      // services
      ...services.map((s) => ({
        url:        `${FRONTEND_URL}/services/${s.slug}`,
        type:       "service",
        lastmod:    s.updatedAt,
        changefreq: "monthly",
        priority:   s.parentService ? 0.7 : 0.8,
      })),

      // blogs
      ...blogs
        .filter((b) => blogMetaMap[b._id.toString()])
        .map((b) => ({
          url:        `${FRONTEND_URL}/insights/${blogMetaMap[b._id.toString()]}`,
          type:       "blog",
          lastmod:    b.updatedAt || b.publishedAt,
          changefreq: "weekly",
          priority:   0.7,
        })),

      // pages
      ...pages.map((p) => ({
        url:        `${FRONTEND_URL}/pages/${p.slug}`,
        type:       "page",
        lastmod:    p.updatedAt,
        changefreq: "yearly",
        priority:   0.5,
      })),
    ];

    res.status(200).json({
      success: true,
      total:   urls.length,
      data:    urls,
    });

  } catch (error) {
    console.error("SITEMAP JSON ERROR:", error.message);
    res.status(500).json({ message: "Failed to generate sitemap" });
  }
};