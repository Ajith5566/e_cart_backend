const mongoose = require('mongoose');

const connectionString = process.env.DATABASE;

mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log("MongoDB Connected Successfully");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err.message);
});
