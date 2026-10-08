const mongoose = require("mongoose");

const moduleAccessSchema = new mongoose.Schema({
  module: { type: String, required: true },
  view:   { type: String, enum: ["all", "own", "none"], default: "none" },
  create: { type: String, enum: ["all", "none"],         default: "none" }, // no "own" — creator owns it automatically
  update: { type: String, enum: ["all", "own", "none"], default: "none" },
  status: { type: String, enum: ["all", "own", "none"], default: "none" },
  delete: { type: String, enum: ["all", "own", "none"], default: "none" },
}, { _id: false });

const permissionSchema = new mongoose.Schema({
  role: { type: String, enum: ["admin", "staff"], required: true, unique: true },
  permissions: [moduleAccessSchema],
}, { timestamps: true });

module.exports = mongoose.model("Permission", permissionSchema);