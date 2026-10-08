// modal/careerApplicationSchema.js
const mongoose = require("mongoose");

const careerApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    // which position they applied for (e.g. "Frontend Developer")
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    // add after jobTitle field
jobId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Job",
  default: null,
},
    // filename of the CV stored on the server: uploads/cv/<cvUrl>
    cvUrl: {
      type: String,
      required: true,
    },
    // original filename, shown in the admin panel ("vivek_resume.pdf")
    cvFileName: {
      type: String,
      default: "",
    },
    // admin workflow status
    status: {
      type: String,
      enum: ["new", "shortlisted", "rejected", "hired"],
      default: "new",
    },
     statusHistory: [
      {
        status: {
          type: String,
          enum: ["new", "shortlisted", "rejected", "hired"],
          required: true,
        },
        reason: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerApplication", careerApplicationSchema);