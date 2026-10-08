//schema for users collection in db


//import mongoose

const mongoose =require("mongoose");

const mongoosePaginate = require("mongoose-paginate-v2");
//schema


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    mailId: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isBlocked:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);


userSchema.plugin(mongoosePaginate)
//model
const users=mongoose.model("users",userSchema)

//export model
module.exports=users;