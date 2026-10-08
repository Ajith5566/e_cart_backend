// modal/jobSchema.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // e.g. ["Tailwind", "Bootstrap", "React js", "Node js"]
    skills: {
      type: [String],
      default: [],
    },
    // e.g. "3+ years"
    experience: {
      type: String,
      required: true,
      trim: true,
    },
    isSystem: {
  type: Boolean,
  default: false,
},
    jobType: {
      type: String,
      enum: ["Full time", "Part time", "Contract", "Internship", "Remote" , "skill-not-listed", "internship-cta"],
      default: "Full time",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    // HTML from the admin rich-text editor
    description: {
      type: String,
      required: true,
    },
    // open (shown on the public page) / closed
    isActive: {
      type: Boolean,
      default: true,
    },
    adminId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // createdAt = "Posted on"
);

module.exports = mongoose.model("Job", jobSchema);