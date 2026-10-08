const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    facebook: {
        type: String,
    },
    twitter: {
        type: String,
    },
    linkedin: {
        type: String,
    },
    instagram: {
        type: String,
    },
    youtube: {
        type: String,
    },
    // ✅ NEW — 4 fixed counter fields
    yearsOfExperience: {
        type: String,
        default: "14+",
    },
    projectsCompleted: {
        type: String,
        default: "460+",
    },
    clientSatisfaction: {
        type: String,
        default: "95%",
    },
     countriesServed: {
        type: String,
        default: "12+",
    },
    // add to settingSchema
bannerType: {
  type: String,
  enum: ["image", "video", "none"],
  default: "none",
},
bannerImage: {
  type: String,
  default: "",
},
bannerVideoUrl: {
  type: String,
  default: "",
},
}, { timestamps: true });

const settings = mongoose.model("settings", settingSchema);
module.exports = settings;