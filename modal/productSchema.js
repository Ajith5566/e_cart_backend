const mongoose=require("mongoose");

const productSchema=new mongoose.Schema({
    productName:{
        type:String,
        require:true
    },
    price:{
        type:String,
        require:true
    },
    quantity:{
        type:String,
        require:true
    },
    image:{
        type:String,
        require:true  // URL or file name
    }
},{ timestamps: true });

//model
const products =mongoose.model("products",productSchema);

//export model
module.exports=products;