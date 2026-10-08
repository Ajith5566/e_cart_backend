// modal/loginHistorySchema.js
const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema({
    name: { type: String, default: null },
  email: { type: String, required: true, lowercase: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser", default: null },
  status: { type: String, enum: ["success", "failed"], required: true },
  reason: { type: String }, // "invalid_password" | "user_not_found" | "account_disabled"
  ip: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

loginHistorySchema.index({ userId: 1, timestamp: -1 });
loginHistorySchema.index({ email: 1, timestamp: -1 }); // needed for failed attempts with no userId

module.exports = mongoose.model("LoginHistory", loginHistorySchema);