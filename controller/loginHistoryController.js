// controller/loginHistoryController.js
const LoginHistory = require("../modal/loginHistorySchema");
const paginate = require("../utils/paginate");

exports.getLoginHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      email,
      name,
      fromDate,
      toDate,
    } = req.query;

    const query = {};

    if (status)   query.status = status;
    if (email)    query.email  = { $regex: email, $options: "i" };
    if (name)     query.name   = { $regex: name,  $options: "i" };

    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // include full "to" day
        query.timestamp.$lte = to;
      }
    }

    const result = await paginate(LoginHistory, query, {
      page,
      limit,
      sort: { timestamp: -1 },
    });

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.error("GET LOGIN HISTORY ERROR:", error);
    res.status(500).json({ message: "Failed to fetch login history" });
  }
};