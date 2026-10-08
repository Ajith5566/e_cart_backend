/* const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); */
const nodemailer = require("nodemailer");
/* 
console.log(process.env.EMAIL_USER);
console.log(process.env.EMAIL_PASS ? "PASS OK" : "PASS MISSING"); */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port:  process.env.EMAIL_PORT,
  secure: false,     
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* transporter.verify((err, success) => {
  if (err) {
    console.error("VERIFY ERROR:", err);
  } else {
    console.log("SMTP READY");
  }
}); */

const sendEmail = async (recipientEmail, subject, text, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject,
      text,
      html,
    });
    console.log("Email sent to:", recipientEmail);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

module.exports = sendEmail;