const products = require("../modal/productSchema");

const fs = require("fs");
const path = require("path");
const mongoose=require("mongoose");


//add project
exports.addproject = async (req, res) => {
  try {
    // ✅ admin id from jwt middleware
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ multer file check
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const image = req.file.filename;

    const { name, price, quantity } = req.body;

    if (!name || !price || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🔍 check existing product
    const existingProduct = await products.findOne({
      productName: name.trim(),
    });

    if (existingProduct) {
      return res.status(409).json({ message: "Product already added" });
    }

    // ✅ save product
    const newProduct = new products({
      productName: name.trim(),
      price,
      quantity,
      image,
      adminId,
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};



//to get all products

exports.getAllproducts =async(req,res)=>{
    try{
        const Allproduct=await products.find();
        res.status(200).json(Allproduct)
    }catch(error){
        res.status(401).json(`failed due to ${error}`)
    }
}

//delete product

exports.deleteProduct = async (req, res) => {
  try {
    
    const { id } = req.params;
    console.log(id);
    
    const product = await products.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // delete image file
    const imagePath = path.join(__dirname, "..", "uploads", product.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await products.findByIdAndDelete({
        _id:id,
        adminId:req.adminId
    });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};


//update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);
    
    const { name, price, quantity } = req.body;
    console.log(req.body);
    

    // safety check
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await products.findById(id);
    console.log(product);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔁 if new image uploaded → delete old image
    if (req.file) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        "uploads",
        product.image
      );

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      product.image = req.file.filename;
    }

    // update fields
    product.productName = name;
    product.price = price;
    product.quantity = quantity;

    await product.save();

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};



//to get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await products.findById(id);
    //console.log(product);
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
};
