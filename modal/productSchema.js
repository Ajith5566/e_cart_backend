const mongoose=require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

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
    image:{
        type:String,
        required:true  // URL or file name
    },
    adminId:{
        type:String,
        required:true
    }
},{ timestamps: true });


productSchema.plugin(mongoosePaginate)


//model
const Products =mongoose.model("Products",productSchema);

//export model
module.exports=Products;