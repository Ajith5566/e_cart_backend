const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  role: { type: String, enum: ["super_admin", "admin", "staff"], required: true },
  resetToken: {
    type: String
  },

  resetTokenExpiry: {
    type: Date
  },
  lastLogin: {
    timestamp: Date,
    ip: String,
  }

}, { timestamps: true });


const admin_users = mongoose.model("admin_users", userSchema);

module.exports = admin_users
