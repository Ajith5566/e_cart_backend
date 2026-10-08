const mongoose = require('mongoose');

const connectionString = process.env.DATABASE;

mongoose
  .connect(connectionString, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });