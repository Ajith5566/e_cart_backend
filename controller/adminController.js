/* const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/mailer");
const Admin = require("../modal/adminSchema");

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
    secure: true,
    sameSite: "none",
    path: "/"      // VERY IMPORTANT
  });

  res.status(200).json({
    message: "Logged out successfully"
  });

};


// ================= FORGOT PASSWORD =================

exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const adminUser = await Admin.findOne({ email });

    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");

    adminUser.resetToken = token;
    adminUser.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await adminUser.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const subject = "Admin Password Reset";

    const html = `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes</p>
    `;

    // send email
    const emailSent = await sendEmail(adminUser.email, subject, "", html);

    // send response only once
    res.status(200).json({
      message: emailSent
        ? "Reset link sent to email"
        : "Email failed but reset link generated",
      resetLink
    });

  } catch (error) {

    console.error("Forgot password error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};



// ================= RESET PASSWORD =================

exports.resetPassword = async (req, res) => {

  try {

    const { token } = req.params;
    const { password } = req.body;

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        message: "This reset link has expired. Please request a new one."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    admin.password = hashedPassword;
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;

    await admin.save();

    res.status(200).json({
      message: "Password reset successful"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error" f
    });

  }
}; */