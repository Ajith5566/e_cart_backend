// modal/caseStudySchema.js
const mongoose = require("mongoose");

const caseStudySchema = new mongoose.Schema(
  {
    // ── BASIC ────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },

    // ── CLIENT DETAILS ───────────────────────────────
    clientName: {
      type: String,
      default: "",
      trim: true,
    },
    clientCompany: {
      type: String,
      default: "",
      trim: true,
    },
    clientDesignation: {
      type: String,
      default: "",
      trim: true,
    },

    // ── PROJECT DETAILS ──────────────────────────────
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",   // Industry collection (future module)
      default: null,
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
      },
    ],
    technologies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "technologies",
      },
    ],
    solutions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Solution",
      },
    ],
    timeline: {
      type: String,        // e.g. "6 months", "Q1 2024 – Q3 2024"
      default: "",
      trim: true,
    },
    websiteUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // ── IMAGES ──────────────────────────────────────
    bannerImage: {
      type: String,
      default: "",
    },
    logo: {
      type: String,
      default: "",
    },
    overviewImage:{
      type:String, 
      deafult:"",
    },
  gallery: [
  {
    image: { type: String, default: "" },
    label: { type: String, default: "", trim: true },
    // e.g. "01 HOMEPAGE — DESKTOP", "02 PRODUCT CATALOGUE", "03 MOBILE VIEW"
  }
],

    // ── CONTENT SECTIONS (Quill HTML) ───────────────
    overview: {
      type: String,
      default: "",
    },
    challenge: {
      type: String,
      default: "",
    },
    proposedSolution: {
      type: String,
      default: "",
    },
    implementation: {
      type: String,
      default: "",
    },
    outcome: {
      type: String,
      default: "",
    },

    // ── STATISTICS (embedded, multiple values) ───────
    // each stat is a title + value pair, e.g. { title: "Customer satisfaction rate", value: "95%" }
    // isFeatured = first/highlighted card (green)
    statistics: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,    // "95%", "2x", "10,000+" — string for flexibility
          required: true,
          trim: true,
        },
        isFeatured: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ── TESTIMONIAL (embedded, one per case study) ───
    testimonial: {
      clientName: { type: String, default: "", trim: true },
      company:    { type: String, default: "", trim: true },
      designation:{ type: String, default: "", trim: true },
      quote:      { type: String, default: "" },
      video:      { type: String, default: "" },   // YouTube URL or video path
      thumbnail:  { type: String, default: "" },   // thumbnail image path
    },

    // ── RELATED CASE STUDIES ─────────────────────────
    relatedCaseStudies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "casestudies",
      },
    ],

    // ── SETTINGS ────────────────────────────────────
    featured: {
      type: Boolean,
      default: false,
    },
    adminId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
  type: Number,
  default: 0,
},
  },
  { timestamps: true }
);

// unique slug index
caseStudySchema.index({ slug: 1 }, { unique: true });
// fast listing queries
caseStudySchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });
caseStudySchema.index({ featured: 1, isActive: 1 });

module.exports = mongoose.model("casestudies", caseStudySchema);


// ── WHAT MOVED TO META ───────────────────────────────
// seoTitle, seoDescription → stored in the existing Meta collection
// as entity_type: "casestudy", entity_id: caseStudy._id
// SEO images (og_image, twitter_image) → also in Meta
// This keeps all SEO in one place and reuses your existing SeoPreview component.


// ── UPDATED metaSchema.js — add "casestudy" to entity_type enum ─────
// Change this line in modal/metaSchema.js:
//
// BEFORE:
//   enum: ["Products", "category", "page", "blog"],
//
// AFTER:
//   enum: ["Products", "category", "page", "blog", "casestudy"],