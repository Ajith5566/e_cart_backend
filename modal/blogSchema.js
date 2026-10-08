const mongoose = require("mongoose");
const { contentBlockSchema } = require("./contentBlockSchema"); // ✅ reusable across modules

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authors",
      required: true,
    },

    shortDescription: {
      type: String,
      default: "",
    },

    // ✅ REPLACED description / quote / youtubeUrl —
    // body content is now an ordered array of typed blocks.
    // Rendered sequentially on the frontend in saved order.
    contentBlocks: {
      type: [contentBlockSchema],
      default: [],
    },

    // Featured image (banner/thumbnail) — unrelated to body content, stays fixed
    image: {
      type: String,
      default: "",
    },

    // Estimated reading time (minutes)
    readTime: {
      type: Number,
      default: 0,
    },

    // Blog views
    views: {
      type: Number,
      default: 0,
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
      },
    ],
    relatedCaseStudies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "casestudies",
      }
    ],
    faqs: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
      },
    ],
    adminId: {
      type: String,
      required: true,
    },
    publicationStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // ✅ ADD — immutable once set on first publish
    publishedAt: { type: Date, default: null },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin_users",
    },
    lastContentUpdatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("blogs", blogSchema);