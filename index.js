// 1) import dotenv module
require('dotenv').config();

// 2) import express
const express = require('express');

// 3) import cors
const cors = require('cors');

// import router
const router = require('./Router/router'); 


// import DB connection
require('./DB/connection');  // ensures DB connects before server starts

// 4) create server
const cartServer = express();

// 5) use cors
cartServer.use(cors());

// 6) convert json to JS object
cartServer.use(express.json());

// 7) use router
cartServer.use(router);


cartServer.use('/uploads',express.static('./uploads'))

//import app middleware


// 8) set port correctly
const PORT = process.env.PORT || 4000;

// 9) run server
cartServer.listen(PORT, () => {
  console.log(`cart server running successfully on port ${PORT}`);
});