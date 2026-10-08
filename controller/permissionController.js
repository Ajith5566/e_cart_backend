// controller/permissionController.js
const Permission = require("../modal/permissionSchema");
const MODULES = require("../constants/module");

exports.getModules = (req, res) => {
  res.status(200).json({ modules: MODULES });
};

exports.getPermissionsByRole = async (req, res) => {
  try {
    const { role } = req.params; // "admin" or "staff"
    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const doc = await Permission.findOne({ role });
    if (!doc) return res.status(404).json({ message: "Permissions not found" });

    res.status(200).json({ permission: doc });
  } catch (error) {
    console.error("GET PERMISSIONS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updatePermissionsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!["admin", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const doc = await Permission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Permissions updated successfully", permission: doc });
  } catch (error) {
    console.error("UPDATE PERMISSIONS ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};