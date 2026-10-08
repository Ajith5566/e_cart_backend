const authorize = (...roles) => {

  return (req, res, next) => {

    if (!req.role) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();

  };

};

module.exports = authorize;

/* authorize("super_admin"), */