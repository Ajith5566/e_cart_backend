const Client = require("../modal/clientSchema");
const mongoose = require("mongoose");
const { publicPath, removeFile } = require("../utils/filestorage");

// ================= ADD =================
exports.addClient = async (req, res) => {
  try {
    /* console.log(req); */
    
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const logoFile = req.files?.["logo"]?.[0];

    let { name, status ,caseStudy } = req.body;
    name = name?.trim();
    if (!name) return res.status(400).json({ message: "Client name is required" });
 
    const client = await Client.create({
      name,
      logo: publicPath("clients", logoFile), // optional — null if not uploaded
      isActive: status === true || status === "true",
      caseStudy: caseStudy || null,
      adminId,
    });

    res.status(201).json({ success: true, message: "Client added", data: client });
  } catch (error) {
    console.error("ADD CLIENT ERROR:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= GET ALL =================
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().sort({ displayOrder: 1}).lean();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    console.error("GET CLIENTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
};

// ================= GET ALL ACTIVE (public) =================
exports.getActiveClients = async (req, res) => {
  try {
    const clients = await Client
      .find({ isActive: true })
      .select("name logo")
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch clients" });
  }
};

// ================= GET BY ID =================
// ================= GET BY ID =================
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    const client = await Client.findById(id)
      .populate("caseStudy", "_id title slug bannerImage")
      .lean();

    if (!client) return res.status(404).json({ message: "Client not found" });

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    console.error("GET CLIENT ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch client" });
  }
};

// ================= UPDATE =================
exports.updateClient = async (req, res) => {
  try {
   /*  console.log(req); */
    
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const logoFile = req.files?.["logo"]?.[0];
    const { name, status, caseStudy} = req.body;
    const trimmedName = name?.trim();

    if (trimmedName) client.name = trimmedName;

    if (logoFile) {
      removeFile(client.logo);
      client.logo = publicPath("clients", logoFile);
    }

     if (caseStudy  !== undefined) client.caseStudy  = caseStudy || null;

    if (status !== undefined) client.isActive = status === true || status === "true";

    await client.save();

    res.status(200).json({ success: true, message: "Client updated", data: client });
  } catch (error) {
    console.error("UPDATE CLIENT ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS =================
exports.toggleClientStatus = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    client.isActive = !client.isActive;
    await client.save();

    res.status(200).json({
      success: true,
      message: client.isActive ? "Client enabled" : "Client disabled",
    });
  } catch (error) {
    console.error("TOGGLE CLIENT ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE =================
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    removeFile(client.logo);
    await Client.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Client deleted" });
  } catch (error) {
    console.error("DELETE CLIENT ERROR:", error.message);
    res.status(500).json({ message: "Delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleClients = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No clients selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const result = await Client.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} client(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE CLIENTS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteClients = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No clients selected" });
    }

    const clients = await Client.find({ _id: { $in: ids } })
      .select("_id logo")
      .lean();

    if (clients.length === 0) {
      return res.status(404).json({ message: "No clients found" });
    }

    for (const c of clients) removeFile(c.logo);

    const result = await Client.deleteMany({
      _id: { $in: clients.map((c) => c._id) },
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} client(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE CLIENTS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

// ================= UPDATE ORDER =================
exports.updateClientOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const invalid = updates.some(
      ({ id, displayOrder }) =>
        !mongoose.Types.ObjectId.isValid(id) || !Number.isInteger(displayOrder)
    );
    if (invalid) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const scope = req.permissionScope === "own" ? { adminId: req.adminId } : {};

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id, ...scope },
        update: { $set: { displayOrder } },
      },
    }));

    await Client.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE CLIENT ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};


