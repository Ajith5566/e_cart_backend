// scripts/seedAdmin.js
require("dotenv").config();
require("../DB/connection");

const mongoose  = require("mongoose");
const AdminUser = require("../modal/adminUsersSchema"); // ✅ check this path

const seed = async () => {
  try {
    // ✅ check which collection it's using
    console.log("Collection name:", AdminUser.collection.name);

    const result = await AdminUser.findByIdAndUpdate(
      new mongoose.Types.ObjectId("6a2153a4eee383aa6b5002a9"),
      {
        $setOnInsert: {
          _id:      new mongoose.Types.ObjectId("6a2153a4eee383aa6b5002a9"),
          name:     "super admin👑",
          email:    "projects@phitany.com",
          password: "$2b$10$7TxjyKvMa5oZRz212QNu2eUNnpqPptKjULQKQQnIAX6zsmMxhkLc.",
          isActive: true,
          role:     "super_admin",
        },
      },
      { upsert: true, new: true }
    );

    console.log("✅ Result:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();