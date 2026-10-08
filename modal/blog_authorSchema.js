const mongoose = require("mongoose");

const blogAuthorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
   tagline: {
      type:String,
    }, 
    description: {
      type: String, 
    },
     linkedin: {
      type: String, 
    },
      instagram: {
      type: String, 
    },
      facebook: {
      type: String, 
    },
      youtube: {
      type: String, 
    },
      twitter: {
      type: String, 
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

const authors = mongoose.model("authors", blogAuthorSchema);

module.exports = authors;