// Import Express to create router
const express = require("express");

// Import controller functions (user )
const userController = require("../controller/userController");
//import controller fro products
const projectController=require("../controller/projectController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const pageController=require("../controller/pageController")
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

//path for getting all users
router.get("/admin/dash/users",userController.getAllusers)

//path for blocking user
router.put("/admin/dash/blockUser/:id",jwtMiddleware,userController.toggleUserBlock)

//path for fetching product by id
router.get("/productsByid/:id", projectController.getProductById);

//path for pages

router.post("/admin/pages", jwtMiddleware, pageController.addPage);
router.get("/admin/pages", jwtMiddleware, pageController.getAllPages);
router.put("/admin/pages/:id", jwtMiddleware, pageController.updatePage);
router.delete("/admin/pages/:id", jwtMiddleware, pageController.deletePage);
router.put(
  "/admin/pages/:id/toggle",
  jwtMiddleware,
  pageController.togglePageStatus
);
router.get("/page/:slug", pageController.getPageBySlug);




// Export router to be used in server.js / app.js
module.exports = router;