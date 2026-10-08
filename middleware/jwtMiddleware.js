const jwt = require("jsonwebtoken");
const AdminUser = require("../modal/adminUsersSchema");
const Permission = require("../modal/permissionSchema");

const jwtMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    const decoded = jwt.verify(token, process.env.MY_SECRET);

    const admin = await AdminUser.findById(decoded.userId).select("role isActive");

    if (!admin) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is disabled" });
    }

    req.adminId = decoded.userId;
    req.role = admin.role; // "super_admin" | "admin" | "staff" — always live

    // super_admin needs no permission lookup — it bypasses everything
    if (admin.role !== "super_admin") {
      const permDoc = await Permission.findOne({ role: admin.role }).select("permissions");
      req.permissions = permDoc?.permissions || [];
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = jwtMiddleware;