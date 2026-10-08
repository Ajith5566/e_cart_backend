// modal/serviceSchema.js
const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    // ── HIERARCHY ────────────────────────────────────────────
    // null     → this is a top-level service (e.g. "Digital Engineering"),
    //            shown as a block on Services.html
    // ObjectId → this is a child/leaf service nested one level under that
    //            top-level service (e.g. "Corporate & Institutional
    //            Websites" under "Digital Engineering")
    //
    // Only two levels deep: the admin form's "Parent Service" picker
    // should only offer services where parentService === null — a leaf
    // can't itself be picked as a parent.
    parentService: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "services",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },
    subTitle:{
       type: String,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ── TOP-LEVEL FIELDS (used when parentService is null) ──
    // "What we do" intro block on Services.html / this service's own page
    description: {
      type: String,
      default: "",
    },
    bannerImage: {
      type: String,
      default: "",
    },
    // ✅ NEW — the bullet list shown under the title on Services.html
    // (e.g. "Corporate & Institutional Websites", "Custom Web
    // Applications"...). Editable independently of the actual child
    // service records — doesn't have to match them 1:1.
    bullets: {
      type: [String],
      default: [],
    },

    // ── LEAF/DETAIL-LEVEL FIELDS (used when parentService is set) ──
    // shown as the bullet line under the parent on Services.html,
    // and as the intro line on the parent page's child card
    shortDescription: {
      type: String,
      default: "",
    },

    // hero subtitle — "Your website is the first handshake..."
    tagline: {
      type: String,
      default: "",
    },
    // reused in two places: the child-card thumbnail on the parent's own
    // page, and the full-width banner on this service's own detail page
    heroImage: {
      type: String,
      default: "",
    },

    // "Let's build a website that works as hard as you do." block
    introTitle: {
      type: String,
      default: "",
    },
    introDescription: {
      type: String,
      default: "",
    },

    // ── PROCESS (Discovery, Design, Build, Launch...) ──
    process: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
      },
    ],

    // ── TECHNOLOGIES — ref + per-service blurb, same pattern as Case Study ──
    technologies: [
      {
        technology: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "technologies",
        },
        description: { type: String, default: "" },
      },
    ],
   // ✅ stores multiple industries
industries: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Industry" }
],

    // ── FAQs ──
    faqs: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
      },
    ],

    // NOTE: relatedCaseStudies, relatedIndustries, "Related services"
    // (siblings under the same parentService), and "From the blog" are
    // ALL derived at render time via API, not stored on this document:
    //   - relatedCaseStudies → query case studies whose `services` array
    //     includes this service's _id
    //   - relatedIndustries  → distinct industries pulled from those same
    //     matched case studies (using the Industry's own generic
    //     description, no custom per-service blurb)
    //   - relatedServices    → other services sharing this parentService

    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: { type: Number, default: 0 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);
serviceSchema.index({ parentService: 1, isActive: 1, displayOrder: 1 });
serviceSchema.index({ featured: 1, isActive: 1 });

module.exports = mongoose.model("services", serviceSchema);

// ── SEO ───────────────────────────────────────────────────
// add "service" to metaSchema's entity_type enum:
//
//   enum: ["Products", "category", "page", "blog", "casestudy", "service"],