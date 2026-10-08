const mongoose = require("mongoose");

const metaSchema = new mongoose.Schema({

  entity_type: {
    type: String,
    enum: ["Products", "category", "page","blog","casestudy", "service"],  // ✅ exact model names
    required: true,
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "entity_type",
  },

  slug:             { type: String, default: "" },
  meta_title:       { type: String, default: "" },
  meta_keywords:    { type: [String], default: [] }, // ✅ array for tag input
  meta_description: { type: String, default: "" },
  canonical_url:    { type: String, default: "" },

  og_title:         { type: String, default: "" },
  og_description:   { type: String, default: "" },
  og_image:         { type: String, default: "" },

  twitter_title:       { type: String, default: "" },
  twitter_description: { type: String, default: "" },
  twitter_image:       { type: String, default: "" },

  schema_markup: { type: String, default: "" },

  allow_indexing:   { type: Boolean, default: true  },
  allow_following:  { type: Boolean, default: true  },
  include_sitemap:  { type: Boolean, default: true  },
  sitemap_priority: { type: String,  default: "0.5" },
  change_frequency: { type: String,  default: "daily" },

}, { timestamps: true });

metaSchema.index({ entity_type: 1, entity_id: 1 }, { unique: true });

const Meta = mongoose.model("Meta", metaSchema);
module.exports = Meta;