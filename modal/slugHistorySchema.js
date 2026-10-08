// modal/slugHistorySchema.js
const mongoose = require("mongoose");

const slugHistorySchema = new mongoose.Schema(
  {
    old_slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    entity_type: {
      type: String,
      enum: ["Products", "category", "page", "blog","casestudies","services"],
      required: true,
    },
    entity_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entity_type",
    },
  },
  { timestamps: true }
);

// One historical slug can only ever point to one entity per type
slugHistorySchema.index({ old_slug: 1, entity_type: 1 }, { unique: true });

const SlugHistory = mongoose.model("SlugHistory", slugHistorySchema);
module.exports = SlugHistory;