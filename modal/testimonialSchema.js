// modal/testimonialSchema.js — updated with type + video fields
const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    // ── TYPE ─────────────────────────────────────────
    type: {
      type: String,
      enum: ["text", "video"],
      default: "text",
    },

    // ── COMMON FIELDS ────────────────────────────────
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },

    // ── TEXT TESTIMONIAL ─────────────────────────────
    message: {
      type: String,
      default: "",
    },
    heading: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    services: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "services",
    default: [],
  },
],
industry: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Industry",
  default: null,
},

    // ── VIDEO TESTIMONIAL ────────────────────────────
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    // thumbnail stored in image field (reused)
    // short quote shown alongside the video
    quote: {
      type: String,
      default: "",
      trim: true,
    },
     displayOrder: {
      type: Number,
      default: 0,
    },

    // ── SETTINGS ────────────────────────────────────
    adminId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("testimonials", testimonialSchema);