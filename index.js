// 1) Load environment variables
require("dotenv").config();

// 2) Imports
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// 3) Import router
const router = require("./Router/router");

// 4) Import DB connection
require("./DB/connection");

// 5) Create server
const cartServer = express();

// 6) CORS (REQUIRED for cookies)
cartServer.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true,              // allow cookies
  })
);

// 7) Parse JSON
cartServer.use(express.json());

// 8) Parse cookies 🍪 (VERY IMPORTANT)
cartServer.use(cookieParser());

// 9) Static files
cartServer.use("/uploads", express.static("./uploads"));

// 10) Routes
cartServer.use(router);

// 11) Port
const PORT = process.env.PORT || 4000;

// 12) Start server
cartServer.listen(PORT, () => {
  console.log(`Cart server running successfully on port ${PORT}`);
});
