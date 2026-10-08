// modal/solutionSchema.js
const mongoose = require("mongoose");

const solutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ rich content for the Solutions landing page.
    // Left optional so the existing lightweight "just a tag" usage
    // (Case Study's Solutions multi-select) keeps working unchanged.
    shortDescription: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    // bullet list — each point has its own uploaded icon + text
    keyPoints: {
      type: [
        {
          icon: { type: String, required: true }, // uploaded image/SVG path
          text: { type: String, required: true, trim: true },
          _id: false,
        },
      ],
      default: [],
    },

    // powers "View Related Case Studies" on the solution block
    relatedCaseStudies: [
      { type: mongoose.Schema.Types.ObjectId, ref: "casestudies" },
    ],

    // controls the order solutions render in on the page
    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Solution", solutionSchema);