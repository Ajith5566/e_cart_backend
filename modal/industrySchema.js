const mongoose = require("mongoose");

const industrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: "" },
    image: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Industry", industrySchema);