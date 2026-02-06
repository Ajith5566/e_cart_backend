const jwt = require("jsonwebtoken");

const createToken = (res, userId) => {
  const token = jwt.sign(
    { userId },
    process.env.MY_SECRET,
    { expiresIn: "30d" }
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

module.exports = createToken;
