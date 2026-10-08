// public_controller/blogController.js
const Blog        = require("../modal/blogSchema");
const Meta        = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
const imageUrl    = require("../utils/imageUrl");
const mongoose = require("mongoose");
const Author   = require("../modal/blog_authorSchema"); // same import your admin authorController uses

// ── helper: prefix imageUrl on gallery contentBlocks ─────────
const processContentBlocks = (blocks = []) =>
  blocks.map((block) => {
    if (block.type === "gallery" && block.images?.length) {
      return {
        ...block,
        images: block.images.map((img) => ({
          ...img,
          image: imageUrl(img.image),
        })),
      };
    }

    if (block.type === "editor" || block.type === "quote") {
  return {
    ...block,
    html: (block.html || "").replace(
      /src="(\/uploads\/[^"]+)"/g,
      (_, path) => `src="${imageUrl(path)}"`
    ),
  };
}
    return block; // editor, youtube, quote — no image fields
  });

// ── helper: build author object with full image URL ───────────
const processAuthor = (author) => {
  if (!author) return null;
  return { ...author, image: imageUrl(author.image) };
};

// ================= GET ALL (listing page) =================
// GET /blogs?limit=12&page=1&service=<id>
exports.getPublicBlogs = async (req, res) => {
  try {
    const { limit = 12, page = 1, service } = req.query;

    const filter = {
      isActive:          true,
      publicationStatus: "published",
    };
    if (service) filter.services = service;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .select("title shortDescription image readTime views services author publishedAt createdAt")
      .populate("author",   "_id name image")
      .populate("services", "_id title slug")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // attach meta slug for each blog (for URL building)
    const blogIds = blogs.map((b) => b._id);
    const metas   = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: blogIds },
    }).select("entity_id slug").lean();

    const metaMap = metas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    const data = blogs.map((b) => ({
      ...b,
      image:  imageUrl(b.image),           // ✅ blog cover image
      slug:   metaMap[b._id.toString()] ?? "",
      author: processAuthor(b.author),     // ✅ author avatar
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore:    skip + blogs.length < total,
      },
    });
  } catch (error) {
    console.error("GET PUBLIC BLOGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

// ================= GET BY SLUG (detail page) =================
// GET /blogs/:slug
exports.getPublicBlogBySlug = async (req, res) => {
  try {
    const slug = req.params.slug?.toLowerCase().trim();

    // find blog via Meta slug
    const meta = await Meta.findOne({ entity_type: "blog", slug });

    if (meta) {
      const blog = await Blog.findOne({
        _id:               meta.entity_id,
        isActive:          true,
        publicationStatus: "published",
      })
        .populate("author",             "_id name image tagline linkedin twitter facebook  instagram youtube")
        .populate("services",           "_id title slug")
        .populate("relatedCaseStudies", "_id title slug bannerImage shortDescription")
        .lean();

      if (blog) {
        // increment views
        await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

        // prefix bannerImage on relatedCaseStudies
        const relatedCaseStudies = (blog.relatedCaseStudies ?? []).map((cs) => ({
          ...cs,
          bannerImage: imageUrl(cs.bannerImage),
        }));

        return res.status(200).json({
          success: true,
          data: {
            ...blog,
            image:              imageUrl(blog.image),                  // ✅ cover image
            contentBlocks:      processContentBlocks(blog.contentBlocks), // ✅ gallery blocks
            author:             processAuthor(blog.author),            // ✅ author avatar
            relatedCaseStudies,                                        // ✅ case study banners
            slug,
            meta: {
              meta_title:          meta.meta_title,
              meta_description:    meta.meta_description,
              meta_keywords:       meta.meta_keywords,
              og_title:            meta.og_title,
              og_description:      meta.og_description,
              og_image:            imageUrl(meta.og_image),            // ✅ og image
              twitter_title:       meta.twitter_title,
              twitter_description: meta.twitter_description,
              twitter_image:       imageUrl(meta.twitter_image),       // ✅ twitter image
              canonical_url:       meta.canonical_url,
              allow_indexing:      meta.allow_indexing,
              schema_markup:       meta.schema_markup,
            },
          },
        });
      }
    }

    // slug history fallback
    const history = await SlugHistory.findOne({
      old_slug:    slug,
      entity_type: "blog",
    });

    if (history) {
      const newMeta = await Meta.findOne({
        entity_type: "blog",
        entity_id:   history.entity_id,
      }).select("slug").lean();

      if (newMeta?.slug) {
        return res.status(200).json({
          redirect: true,
          newSlug:  newMeta.slug,
        });
      }
    }

    return res.status(404).json({ message: "Blog not found" });
  } catch (error) {
    console.error("GET PUBLIC BLOG BY SLUG ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET RELATED BLOGS =================
// GET /blogs/:slug/related?limit=3
exports.getRelatedBlogs = async (req, res) => {
  try {
    const slug  = req.params.slug?.toLowerCase().trim();
    const limit = Number(req.query.limit) || 3;

    const meta = await Meta.findOne({ entity_type: "blog", slug });
    if (!meta) return res.status(404).json({ message: "Blog not found" });

    const blog = await Blog.findById(meta.entity_id).select("services").lean();
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const related = await Blog.find({
      _id:               { $ne: blog._id },
      isActive:          true,
      publicationStatus: "published",
      services:          { $in: blog.services },
    })
      .select("title shortDescription image readTime publishedAt author services")
      .populate("author",   "_id name image")
      .populate("services", "_id title slug")
      .limit(limit)
      .lean();

    // attach slugs
    const relatedIds = related.map((b) => b._id);
    const metas      = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: relatedIds },
    }).select("entity_id slug").lean();

    const metaMap = metas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    const data = related.map((b) => ({
      ...b,
      image:  imageUrl(b.image),       // ✅ cover image
      slug:   metaMap[b._id.toString()] ?? "",
      author: processAuthor(b.author), // ✅ author avatar
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("GET RELATED BLOGS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch related blogs" });
  }
};

// public_controller/blogController.js — ADD

// GET /blogs/author/:authorId — blogs by specific author
exports.getPublicBlogsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { limit = 12, page = 1 } = req.query;

    const filter = {
      isActive:          true,
      publicationStatus: "published",
      author:            authorId,
    };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .select("title shortDescription image readTime views services author publishedAt createdAt")
      .populate("author",   "_id name image tagline")
      .populate("services", "_id title slug")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // attach slugs from Meta
    const blogIds = blogs.map((b) => b._id);
    const metas   = await Meta.find({
      entity_type: "blog",
      entity_id:   { $in: blogIds },
    }).select("entity_id slug").lean();

    const metaMap = metas.reduce((acc, m) => {
      acc[m.entity_id.toString()] = m.slug;
      return acc;
    }, {});

    const data = blogs.map((b) => ({
      ...b,
      image:  imageUrl(b.image),
      slug:   metaMap[b._id.toString()] ?? "",
      author: b.author ? { ...b.author, image: imageUrl(b.author.image) } : null,
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasMore:    skip + blogs.length < total,
      },
    });
  } catch (error) {
    console.error("GET BLOGS BY AUTHOR ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
};

exports.getPublicAuthorById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: "Author not found" });
    }

    const author = await Author.findById(id)
      .select("_id name image tagline linkedin twitter instagram description facebook  youtube")
      .lean();

    if (!author) return res.status(404).json({ success: false, message: "Author not found" });

    res.status(200).json({
      success: true,
      data: { ...author, image: imageUrl(author.image) },
    });
  } catch (error) {
    console.error("GET PUBLIC AUTHOR ERROR:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch author" });
  }
};