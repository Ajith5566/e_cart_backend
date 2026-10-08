// modal/technologySchema.js
const mongoose = require("mongoose");

const technologySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
     tag: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    adminId: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// unique index on slug — no two technologies share the same slug
technologySchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("technologies", technologySchema);