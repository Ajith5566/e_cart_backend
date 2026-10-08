// modal/contentBlockSchema.js
// ✅ Reusable block-editor sub-schema. Embed via `contentBlocks: [contentBlockSchema]`
// in any model (Blog, Page, etc). NOT a standalone model — no _id collection of its own.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const BLOCK_TYPES = ["editor", "gallery", "youtube", "quote"];

const galleryImageSchema = new Schema(
  {
    image:   { type: String, required: true }, // stored public path, e.g. /uploads/blogs/xyz.jpg
    caption: { type: String, default: "" },
  },
  { _id: false }
);

const contentBlockSchema = new Schema(
  {
    // client-generated stable id (uuid) — used for React keys, drag/drop reordering,
    // and to target a specific block for image removal without touching the rest
    blockId: { type: String, required: true },

    type: {
      type: String,
      enum: BLOCK_TYPES,
      required: true,
    },

    // ── "editor" and "quote" blocks — mandatory heading/title for the block ──
    label: { type: String, default: "" },

    // ── "editor" and "quote" blocks ──
    html: { type: String, default: "" },

    // ── "youtube" block ──
    youtubeUrl: { type: String, default: "" },

    // ── "gallery" block ──
    images: { type: [galleryImageSchema], default: undefined },
  },
  { _id: false }
);

module.exports = { contentBlockSchema, BLOCK_TYPES };