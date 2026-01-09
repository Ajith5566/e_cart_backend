const products = require("../modal/productSchema");

exports.addproject=async(req,res)=>{
    console.log("inside project controller")
    
    const adminId=req.payload;
    console.log(adminId)

    const image=req.file.filename;
    console.log(image);

    const {name,price,quantity}=req.body
    console.log(name,price,quantity);
    
    try{

        const existingProduct = await products.findOne({productName:name});

        if(existingProduct){
            res.status(406).json('product already added');
        }else{
            const newProduct = new products({
                productName:name,
                price,
                quantity,
                image,
                adminId
            })
            await newProduct.save();
            res.status(200).json(newProduct);
        }
    }catch(error){
        res.status(406).json('request failed due to',error)
    }
    
    
}