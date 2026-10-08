// middleware/checkPermission.js
const checkPermission = (module, action) => {
  return (req, res, next) => {
    if (req.role === "super_admin") {
      req.permissionScope = "all";
      return next();
    }

    const modulePerm = (req.permissions || []).find((p) => p.module === module);
    const value = modulePerm?.[action] || "none"; // "all" | "own" | "none"

    if (value === "none") {
      return res.status(403).json({ message: "Access denied" });
    }

    req.permissionScope = value; // "all" or "own" — controller uses this to filter
    next();
  };
};

module.exports = checkPermission;