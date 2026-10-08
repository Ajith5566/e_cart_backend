// ============================================================
// public_controller/contactController.js
// ============================================================

const Contact = require("../modal/contactSchema");
const { verifyCaptcha } = require("../utils/verifyCaptcha");

// POST /contact — submit a contact enquiry
exports.submitContact = async (req, res) => {
  try {
    const { name, email, phone, message ,recaptchaToken} = req.body;
      // ✅ verify captcha with action name
  const captcha = await verifyCaptcha(recaptchaToken, "contact_form");
  if (!captcha.success) {
    return res.status(400).json({ message: captcha.error || "CAPTCHA verification failed" });
  }

    if (!name?.trim())    return res.status(400).json({ message: "Name is required" });
    if (!email?.trim())   return res.status(400).json({ message: "Email is required" });
    if (!phone?.trim())   return res.status(400).json({ message: "Phone is required" });
    if (!message?.trim()) return res.status(400).json({ message: "Message is required" });

    await Contact.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone.trim(),
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Thank you for reaching out. We will get back to you soon.",
    });
  } catch (error) {
    console.error("SUBMIT CONTACT ERROR:", error.message);
    res.status(500).json({ message: "Failed to submit enquiry" });
  }
};


// ============================================================
// Router/public_router.js — ADD
// ============================================================
/*
const contactController = require("../public_controller/contactController");

router.post("/contact", contactController.submitContact);
*/