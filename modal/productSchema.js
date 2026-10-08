const mongoose=require("mongoose");

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true
    },
    quantity:{
        type:String,
        required:true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref:"category",
       default: null
    }, 
    shortDescription: {
      type: String,
      required: true,
    },
    description: {
      type: String, // HTML content
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
     images:[String], 
    adminId:{
        type:String,
        required:true
    },// modal/productSchema.js — add this field
},{ timestamps: true });


//model
const Products =mongoose.model("Products",productSchema);

//export model
module.exports=Products;