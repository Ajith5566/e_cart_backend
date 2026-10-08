const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    sub_title: {
      type: String,
    },
    button_text: {
      type: String, // HTML content
    },
    url: {
      type: String, // HTML content
    },
    banner_image: {
      type: String,
      require: true
    },

    adminId: {
      type: String,
      required: true
    },
    mobile_image: {
      type: String,
      require: true
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    adminId: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

const banners = mongoose.model("banners", bannerSchema);

module.exports = banners;