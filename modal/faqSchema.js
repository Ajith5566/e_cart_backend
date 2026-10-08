// modal/faqSchema.js
const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    // controls the order FAQs render in on the homepage.
    // Without this, reordering existing questions has no clean way to work
    // (createdAt sort breaks the moment you need to insert one in the middle).
    displayOrder: {
      type: Number,
      default: 0,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ displayOrder: 1 });

module.exports = mongoose.model("Faq", faqSchema);