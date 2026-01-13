// Import Express to create router
const express = require("express");

// Import controller functions (user )
const userController = require("../controller/userController");
//import controller fro products
const projectController=require("../controller/projectController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

//import multer
const multerconfig = require("../middleware/multerMiddleware");


// ROUTER INITIALIZATION
// Create an Express Router instance
const router = express.Router();

// Register a new user
// Endpoint: POST /user/register
router.post("/user/register", userController.register);

// Login existing user
// Endpoint: POST /user/login
router.post("/user/login", userController.login);

//admin login
router.post("/admin/login",userController.adminlogin)

//path for resolving prduct
router.post("/add-product",jwtMiddleware,multerconfig.single('image'),projectController.addproject)

//path for getting all products
router.get("/admin/products",projectController.getAllproducts)

//path for delete product
router.delete("/admin/product/:id", jwtMiddleware, projectController.deleteProduct);


//path for update product
router.put("/admin/productUpdate/:id",jwtMiddleware,multerconfig.single("image"),projectController.updateProduct);


// Export router to be used in server.js / app.js
module.exports = router;