const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

   parent_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    }, 
    shortDescription: {
      type: String, // HTML content
    },
     description: {
      type: String, // HTML content
    }, 
    image:{
      type:String}, 
    adminId:{
        type:String,
        required:true
    },
    isActive: {
      type: Boolean,
      default: true,
    },

  },
  { timestamps: true }
);

const category = mongoose.model("category", categorySchema);

module.exports = category;