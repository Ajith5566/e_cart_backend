const jwt = require("jsonwebtoken");

const jwtMiddleware = (req, res, next) => {
  try {
    // 🍪 Read token from cookie
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token" });
    }

    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.MY_SECRET);

    // Attach admin info to request
    req.adminId = decoded.userId;
    req.role = decoded.role;

    next(); // ✅ allow request to continue
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = jwtMiddleware;
