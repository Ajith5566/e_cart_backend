const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    caseStudy:
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "casestudies",
             default: null,
          }
        ,
    displayOrder: { type: Number, default: 0 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);