// Import Express to create router
const express = require("express");

// Import controller functions (user )
const userController = require("../controller/userController");
//import controller fro products
const projectController=require("../controller/projectController")


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
router.post("/add-product",projectController.addproject)

// Export router to be used in server.js / app.js
module.exports = router;