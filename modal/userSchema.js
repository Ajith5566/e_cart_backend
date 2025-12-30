//schema for users collection in db


//import mongoose

const mongoose =require("mongoose");
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
  },
  { timestamps: true }
);



//model
const users=mongoose.model("users",userSchema)

//export model
module.exports=users;