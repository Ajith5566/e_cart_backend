const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 300,
    },
    description: {
      type: String, // HTML content
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


pageSchema.plugin(mongoosePaginate)
//model
const pages=mongoose.model("page",pageSchema)

//export model
module.exports=pages;
