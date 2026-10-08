const jwt = require("jsonwebtoken");

const createToken = (res, user, rememberMe = false) => {

  const accessToken = jwt.sign(
    { userId: user._id },
    process.env.MY_SECRET,
    { expiresIn: "1h" }
  );

  // hardcoded like the original — works on all hosts without NODE_ENV dependency
  res.cookie("jwt", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    ...(rememberMe && { maxAge: 60 * 60 * 1000 }), // only set maxAge when remember me checked
  });

  if (rememberMe) {
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/admin/refresh",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
};

module.exports = createToken;