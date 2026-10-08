const Contact = require("../modal/contactSchema");
const CareerApplication = require("../modal/careerAppicationSchema");

/* GET /api/admin/dashboard/overview
   Latest 3 contact enquiries + latest 3 career applications */
const getDashboardOverview = async (req, res) => {
  try {
    const [
      enquiryCount,
      applicationCount,
      newApplicationCount,
      latestEnquiries,
      latestApplications,
    ] = await Promise.all([
      Contact.countDocuments(),
      CareerApplication.countDocuments(),
      CareerApplication.countDocuments({ status: "new" }),

      Contact.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select("name email phone message createdAt")
        .lean(),

      CareerApplication.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select("name email phone jobTitle status isRead createdAt")
        .lean(),
    ]);

    return res.status(200).json({
      counts: {
        enquiries: enquiryCount,
        applications: applicationCount,
        newApplications: newApplicationCount,
      },
      latestEnquiries,
      latestApplications,
    });
  } catch (error) {
    console.log("getDashboardOverview error:", error.message);
    console.log("getDashboardOverview stack:", error.stack);
    return res.status(500).json({ message: "Failed to load dashboard overview" });
  }
};

module.exports = { getDashboardOverview };