
//import mongoose

const mongoose =require("mongoose");
//schema


const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });


//model
const admin=mongoose.model("admin",adminSchema)

//export model
module.exports=admin;