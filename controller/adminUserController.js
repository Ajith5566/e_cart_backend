const AdminUser = require("../modal/adminUsersSchema");
const bcrypt = require("bcrypt")
const createToken = require("../utils/createToken");
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/mailer");
const crypto = require("crypto")
const LoginHistory = require("../modal/loginHistorySchema");
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
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/admin/refresh",
  });

  res.status(200).json({ message: "Logged out successfully" });
};


exports.createAdminUser = async (req, res) => {

  try {

    const { name, email, password, role } = req.body;

    // Check existing user
    const existingUser = await AdminUser.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // Hash password
     const hashedPassword = await bcrypt.hash(password, 10); 

    // Create new user
    const newUser = new AdminUser({
      name,
      email,
      password:hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

};


//get all users
exports.getAllUsers = async (req, res) => {

try {
     const users = await AdminUser.find()
      .sort({ createdAt: -1 })
      .lean();
      
     res.status(200).json(users);
   } catch (err) {
     res.status(500).json({ message: "Failed to fetch users" });
   }

};

// 🗑️ Delete page
exports.deleteAdminUser = async (req, res) => {
  try {
    await AdminUser.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Page deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// 🔄 Toggle active
exports.toggleAdmin_User_Status = async (req, res) => {
  const user = await AdminUser.findById(req.params.id);
  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    message: user.isActive ? "user enabled" : "user disabled",
  });
};

// ✏️ Update 
exports.updateAdmin_user = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    // ✅ build update object dynamically
    const updateFields = { name, email, role };

    // ✅ only hash password if provided
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    const user = await AdminUser.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });

  } catch (err) {
    console.error("UPDATE USER ERROR:", err); // ✅ check your terminal for the real error
    res.status(500).json({ message: "Update failed" });
  }
};


//admin login

exports.adminuserslogin = async (req, res) => {
  const { email, password, rememberMe } = req.body; // ✅ added rememberMe
  const ip = req.ip;
  const userAgent = req.headers["user-agent"];

  try {
    const admin = await AdminUser.findOne({ email });

    if (!admin) {
      await LoginHistory.create({ email, status: "failed", reason: "user_not_found", ip, userAgent });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!admin.isActive) {
      await LoginHistory.create({ email, name: admin.name, userId: admin._id, status: "failed", reason: "account_disabled", ip, userAgent });
      return res.status(403).json({ message: "Account is disabled" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      await LoginHistory.create({ email, name: admin.name, userId: admin._id, status: "failed", reason: "invalid_password", ip, userAgent });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await LoginHistory.create({ email, name: admin.name, userId: admin._id, status: "success", ip, userAgent });

    admin.lastLogin = { timestamp: new Date(), ip };
    await admin.save();

    // ✅ pass rememberMe — handles both boolean true and string "true" from form submissions
    const shouldRemember = rememberMe === true || rememberMe === "true";
    createToken(res, admin, shouldRemember);

    res.status(200).json({
      message: "Login successful",
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role, isActive: admin.isActive },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
};

// getProfile controller
exports.getProfile = async (req, res) => {
  
  
  try {
    const user = await AdminUser
      .findById(req.adminId)   // ← was req.adminId
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await AdminUser.findById(req.adminId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    // ✅ your style
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};


// ================= FORGOT PASSWORD =================

exports.forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const adminUser = await AdminUser.findOne({ email });

    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // generate token
    const token = crypto.randomBytes(32).toString("hex");

    adminUser.resetToken = token;
    adminUser.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await adminUser.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
 /* console.log("Reset link:", resetLink); */
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

      const admin = await AdminUser.findOne({
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
        message: "Server error"
      });

    }
  };
  // New controller function
  exports.verifyResetToken = async (req, res) => {
    try {
      const { token } = req.params;

      const admin = await AdminUser.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
      });

      if (!admin) {
        return res.status(400).json({
          valid: false,
          message: "This reset link has expired. Please request a new one."
        });
      }

      return res.status(200).json({ valid: true });

    } catch (error) {
      console.error(error);
      res.status(500).json({ valid: false, message: "Server error" });
    }
  };


exports.getuserbyId = async (req, res) => {
  try {

    const { id } = req.params;
    const userData = await AdminUser.findById(id)


    if (!userData) {
      return res.status(404).json({ message: "user not found" });
    }


    res.status(200).json({
      success: true,
      data:userData
    });

  } catch (error) {
    console.error("GET user ERROR:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

//admin permission
// controller/adminUserController.js
exports.checkAdminAuth = (req, res) => {
  res.status(200).json({
    authenticated: true,
    adminId: req.adminId,
    role: req.role,
    permissions: req.role === "super_admin" ? null : req.permissions, // null = unrestricted
  });
};

// controller/adminUserController.js
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const admin = await AdminUser.findById(decoded.userId).select("isActive role");

    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newAccessToken = jwt.sign(
      { userId: admin._id },
      process.env.MY_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed" });

  } catch (error) {
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "none", path: "/" });
    res.clearCookie("refresh_token", { httpOnly: true, secure: true, sameSite: "none", path: "/admin/refresh" });
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
};