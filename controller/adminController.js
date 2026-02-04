// controller
exports.checkAdminAuth = (req, res) => {
  res.status(200).json({
    authenticated: true,
    adminId: req.adminId,
    role: req.role,
  });
};

exports.logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};
