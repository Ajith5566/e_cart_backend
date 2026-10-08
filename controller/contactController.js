// controller/contactController.js
const Contact = require("../modal/contactSchema");
const sendEmail = require("../utils/mailer");
const { verifyCaptcha } = require("../utils/verifyCaptcha");
const Settings = require("../modal/settingSchema"); // ajust path to your model

exports.submitContact = async (req, res) => {
  try {
    console.log(req.body);
    
    const { name, email, phone, message,recaptchaToken } = req.body;


    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
          // ✅ verify captcha with action name
       const captcha = await verifyCaptcha(recaptchaToken, "contact_form");
      if (!captcha.success) {
        return res.status(400).json({ message: captcha.error || "CAPTCHA verification failed" });
      } 

    // save to DB
    const contact = await Contact.create({ name, email, phone, message });

    // ── Email 1: confirmation to the user ──────────────────────────────
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e8e8e5;">
          <h2 style="margin: 0 0 8px; color: #1a1a2e;">Thanks for reaching out, ${name}!</h2>
          <p style="color: #6b6e80; margin: 0 0 24px; font-size: 15px;">
            We've received your message and will get back to you shortly.
          </p>

          <div style="background: #f6f6f4; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #9b9b9b; text-transform: uppercase; letter-spacing: 0.05em;">Your message</p>
            <p style="margin: 0; color: #1a1a2e; font-size: 15px; line-height: 1.6;">${message}</p>
          </div>

          <p style="color: #6b6e80; font-size: 14px; margin: 0 0 4px;">
            In the meantime, you can reach us at:
          </p>
          <p style="color: #1a1a2e; font-size: 14px; font-weight: 600; margin: 0;">
            info@phitany.com &nbsp;·&nbsp; (+91) 77360 78808
          </p>

          <hr style="border: none; border-top: 1px solid #e8e8e5; margin: 24px 0;" />
          <p style="color: #b0b0b0; font-size: 12px; margin: 0;">
            Phitany Business Solutions &nbsp;·&nbsp; phitany.dev.in
          </p>
        </div>
      </div>
    `;

    // ── Email 2: notification to your team ─────────────────────────────
    const teamHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9;">
        <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e8e8e5;">
          <h2 style="margin: 0 0 4px; color: #1a1a2e;">New contact form submission</h2>
          <p style="color: #9b9b9b; font-size: 13px; margin: 0 0 24px;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; width: 120px; border-bottom: 1px solid #f1f1f1;">Name</td>
              <td style="padding: 10px 0; color: #1a1a2e; font-weight: 600; border-bottom: 1px solid #f1f1f1;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; border-bottom: 1px solid #f1f1f1;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1;">
                <a href="mailto:${email}" style="color: #185fa5; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b6e80; border-bottom: 1px solid #f1f1f1;">Phone</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f1f1;">
                <a href="tel:${phone}" style="color: #185fa5; text-decoration: none;">${phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 12px 10px 0; color: #6b6e80; vertical-align: top;">Message</td>
              <td style="padding: 10px 0; color: #1a1a2e; line-height: 1.6;">${message}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    // fire both emails concurrently — don't block the response on either
    /* console.log("TEAM_EMAIL =", process.env.TEAM_EMAIL);
console.log("EMAIL_USER =", process.env.EMAIL_USER); */
     // ── Get admin/team email from Settings, fallback to env vars ──
    let teamEmail = process.env.HR_EMAIL || process.env.TEAM_EMAIL || process.env.EMAIL_USER;
    try {
      const settings = await Settings.findOne().select("email").lean();
      if (settings?.email) {
        teamEmail = settings.email;
      }
    } catch (settingsErr) {
      console.error("Failed to fetch settings email, using fallback:", settingsErr);
    }
/* console.log("Sending admin mail to:", teamEmail); */
    Promise.all([
      sendEmail(email, "We received your message — Phitany", "", userHtml),
      sendEmail(teamEmail, `New enquiry from ${name}`, "", teamHtml),
    ]).catch((err) => console.error("Contact email error:", err));

    res.status(201).json({
      success: true,
      message: "Message received. We'll be in touch soon.",
      id: contact._id,
    });

  } catch (error) {
    console.error("CONTACT FORM ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// optional — get all submissions in your admin panel
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    // find banner
    const contactData = await Contact.findById(id);

    if (!contactData) {
      return res.status(404).json({
        message: "enquiry not found",
      });
    }




    /*
    ─────────────────────────────
    DELETE DOCUMENT
    ─────────────────────────────
    */

    await Contact.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });

  } catch (error) {
    console.error("DELETE Contact ERROR:", error);

    return res.status(500).json({
      message: error.message || "Delete failed",
    });
  }
};

exports.getEnquirybyId = async (req, res) => {
  try {

    const { id } = req.params;
    const EnquiryData = await Contact.findById(id)


    if (!EnquiryData) {
      return res.status(404).json({ message: "enquiry not found" });
    }


    res.status(200).json({
      success: true,
      data:EnquiryData
    });

  } catch (error) {
    console.error("GET enquiry ERROR:", error);
    res.status(500).json({ message: "Failed to fetch enquiry" });
  }
};

exports.bulkDeleteContacts = async (req, res) => {
  try {
    const { ids } = req.body;
 
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No enquiries selected" });
    }
 
    const result = await Contact.deleteMany({ _id: { $in: ids } });
 
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} enquiry(ies) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE CONTACTS ERROR:", error);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};
