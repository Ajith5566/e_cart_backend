require("dotenv").config(); // 🔥 REQUIRED

const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const Admin = require("./modal/adminSchema");

const connectionString = process.env.DATABASE;



async function seedAdmin() {
  try {
    await mongoose.connect(connectionString);
    console.log("DB connected");

    const existingAdmin = await Admin.findOne({
      email: "admin@gmail.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      email: "admin@gmail.com",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
