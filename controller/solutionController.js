// controller/solutionController.js
const Solution = require("../modal/solutionSchema");
const { publicPath, removeFile, removeFiles } = require("../utils/filestorage");
const mongoose = require("mongoose");

const ICON_FOLDER = "solutions";
const SOLUTION_FOLDER = "solutions"; 

const toBool = (val, fallback) => {
  if (val === undefined) return fallback;
  if (typeof val === "boolean") return val;
  return val === "true";
};

// ── key point processing ──────────────────────────────────────────
// New icon files arrive in keyPointIcons in the same left-to-right order
// their empty placeholder ("") appears in the keyPoints JSON.
const processKeyPoints = (rawKeyPoints, uploadedIconFiles) => {
  if (!Array.isArray(rawKeyPoints)) return [];
  const fileQueue = [...(uploadedIconFiles || [])];

  return rawKeyPoints
    .map((kp) => {
      if (!kp || typeof kp.text !== "string") return null;
      const text = kp.text.trim();
      if (!text) return null;

      // ✅ treat empty string as no icon (not just undefined/null)
      if (kp.icon && kp.icon.trim() !== "") {
        return { icon: kp.icon, text };
      }

      const file = fileQueue.shift();
      if (!file) return null;
      return { icon: publicPath(ICON_FOLDER, file), text };
    })
    .filter(Boolean);
};
// ✅ a key point that's been started must be complete — no half-filled
// points (text with no icon, or vice versa) saved silently
// controller/solutionController.js

const validateKeyPoints = (rawKeyPoints, uploadedIconFilesCount) => {
  let fileIndex = 0;

  for (const kp of rawKeyPoints || []) {
    const hasText = !!(kp.text || "").trim();
    const hasIcon = !!kp.icon;

    if (hasText && !hasIcon) {
      // no icon yet — check if an uploaded file is queued to fill it
      if (fileIndex < uploadedIconFilesCount) {
        fileIndex++; // this point will be filled by processKeyPoints later
        continue;
      }
      return "Every key point needs an icon";
    }

    if (!hasText && hasIcon) {
      return "Every key point needs text";
    }
  }

  return null;
};

// ================= ADD SOLUTION =================
exports.addSolution = async (req, res) => {
  try {
    const adminId = req.adminId;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const imageFile = req.files?.image?.[0];
    
    const iconFiles = req.files?.keyPointIcons || [];

    const { name, shortDescription, keyPoints, relatedCaseStudies, status } = req.body;




// cleanup on validation error also needs fixing:
if (!name || !name.trim()) {
  removeFiles(
    ...iconFiles.map((f) => publicPath(ICON_FOLDER, f)),
    imageFile ? publicPath(SOLUTION_FOLDER, imageFile) : null
  );
  return res.status(400).json({ message: "Name is required" }); // ✅ must return
}

    let rawKeyPoints;
    try {
      rawKeyPoints = keyPoints ? JSON.parse(keyPoints) : [];
    } catch {
      return res.status(400).json({ message: "Invalid keyPoints payload" });
    }

    const kpError = validateKeyPoints(rawKeyPoints, iconFiles.length); // ⬅ pass count
    if (kpError) {
      removeFiles(...iconFiles.map((f) => publicPath(ICON_FOLDER, f)));
      return res.status(400).json({ message: kpError });
    }
    const processedKeyPoints = processKeyPoints(rawKeyPoints, iconFiles);
    const image = imageFile ? publicPath(SOLUTION_FOLDER, imageFile) : ""; // ✅


    const solution = await Solution.create({
      name: name.trim(),
      shortDescription: shortDescription || "",
      image,
      keyPoints: processedKeyPoints,
      relatedCaseStudies: relatedCaseStudies ? JSON.parse(relatedCaseStudies) : [],
      isActive: toBool(status, true),
      adminId,
    });

    res.status(201).json({ success: true, message: "Solution created", data: solution });
  } catch (error) {
    console.error("ADD SOLUTION ERROR:", error.message);
    res.status(500).json({ message: "Solution creation failed" });
  }
};

// ================= GET ALL SOLUTIONS =================
exports.getAllSolutions = async (req, res) => {
  try {
    const filter = {};
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const solutions = await Solution.find(filter)
      .populate("relatedCaseStudies", "_id title")
      .sort({  displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: solutions });
  } catch (error) {
    console.error("GET ALL SOLUTIONS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch solutions" });
  }
};

// ================= GET SOLUTION BY ID =================
exports.getSolutionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid solution ID" });
    }

    const solution = await Solution.findById(id).populate("relatedCaseStudies", "_id title");
    if (!solution) return res.status(404).json({ message: "Solution not found" });

    res.status(200).json({ success: true, data: solution });
  } catch (error) {
    console.error("GET SOLUTION ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch solution" });
  }
};

// ================= UPDATE SOLUTION =================
exports.updateSolution = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid solution ID" });
    }

    const solution = await Solution.findById(id);
    if (!solution) return res.status(404).json({ message: "Solution not found" });

    if (req.permissionScope === "own" && solution.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only edit your own solutions" });
    }

    const imageFile = req.files?.image?.[0];
    /* console.log(imageFile); */
    
    const iconFiles = req.files?.keyPointIcons || [];

    const { name, shortDescription, keyPoints, relatedCaseStudies, displayOrder, status } = req.body;

    if (imageFile) {
  removeFile(solution.image);
  solution.image = publicPath(SOLUTION_FOLDER, imageFile); // ✅ correct folder
}

    if (keyPoints !== undefined) {
      let rawKeyPoints;
      try {
        rawKeyPoints = JSON.parse(keyPoints);
      } catch {
        return res.status(400).json({ message: "Invalid keyPoints payload" });
      }

      const kpError = validateKeyPoints(rawKeyPoints, iconFiles.length); // ⬅ pass count
      if (kpError) {
        removeFiles(...iconFiles.map((f) => publicPath(ICON_FOLDER, f)));
        return res.status(400).json({ message: kpError });
      }
      const processedKeyPoints = processKeyPoints(rawKeyPoints, iconFiles);

      const oldIcons = (solution.keyPoints || []).map((kp) => kp.icon).filter(Boolean);
      const newIcons = processedKeyPoints.map((kp) => kp.icon).filter(Boolean);
      const orphaned = oldIcons.filter((p) => !newIcons.includes(p));
      if (orphaned.length) removeFiles(...orphaned);

      solution.keyPoints = processedKeyPoints;
    }

    solution.name = name !== undefined ? name.trim() : solution.name;
    solution.shortDescription = shortDescription ?? solution.shortDescription;
    if (relatedCaseStudies !== undefined) solution.relatedCaseStudies = JSON.parse(relatedCaseStudies);
    if (displayOrder !== undefined) solution.displayOrder = Number(displayOrder) || 0;
    if (status !== undefined) solution.isActive = toBool(status, solution.isActive);

    await solution.save();

    res.status(200).json({ success: true, message: "Solution updated", data: solution });
  } catch (error) {
    console.error("UPDATE SOLUTION ERROR:", error.message);
    res.status(500).json({ message: "Update failed" });
  }
};

// ================= TOGGLE STATUS (isActive / visibility) =================
exports.toggleSolutionStatus = async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    if (!solution) return res.status(404).json({ message: "Solution not found" });

    if (req.permissionScope === "own" && solution.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only modify your own solutions" });
    }

    solution.isActive = !solution.isActive;
    await solution.save();

    res.status(200).json({
      success: true,
      message: solution.isActive ? "Solution enabled" : "Solution disabled",
    });
  } catch (error) {
    console.error("TOGGLE SOLUTION ERROR:", error.message);
    res.status(500).json({ message: "Toggle failed" });
  }
};

// ================= DELETE SOLUTION =================
exports.deleteSolution = async (req, res) => {
  try {
    const { id } = req.params;

    const solution = await Solution.findById(id);
    if (!solution) return res.status(404).json({ message: "Solution not found" });

    if (req.permissionScope === "own" && solution.adminId?.toString() !== req.adminId) {
      return res.status(403).json({ message: "You can only delete your own solutions" });
    }

    removeFiles(solution.image, ...(solution.keyPoints || []).map((kp) => kp.icon));
    await Solution.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Solution deleted" });
  } catch (error) {
    console.error("DELETE SOLUTION ERROR:", error.message);
    res.status(500).json({ message: "Solution delete failed" });
  }
};

// ================= BULK TOGGLE =================
exports.bulkToggleSolutions = async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No solutions selected" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be true or false" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const result = await Solution.updateMany(filter, { $set: { isActive } });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} solution(s) ${isActive ? "activated" : "deactivated"}`,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK TOGGLE SOLUTIONS ERROR:", error.message);
    res.status(500).json({ message: "Bulk status update failed" });
  }
};

// ================= BULK DELETE =================
exports.bulkDeleteSolutions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No solutions selected" });
    }

    const filter = { _id: { $in: ids } };
    if (req.permissionScope === "own") filter.adminId = req.adminId;

    const solutions = await Solution.find(filter).select("_id image keyPoints").lean();
    if (solutions.length === 0) {
      return res.status(404).json({ message: "No deletable solutions in selection" });
    }

    for (const s of solutions) {
      removeFiles(s.image, ...(s.keyPoints || []).map((kp) => kp.icon));
    }

    const result = await Solution.deleteMany({ _id: { $in: solutions.map((s) => s._id) } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} solution(s) deleted`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("BULK DELETE SOLUTIONS ERROR:", error.message);
    res.status(500).json({ message: "Bulk delete failed" });
  }
};

exports.updateSolutionOrder = async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No order data provided" });
    }

    const filter = req.permissionScope === "own" ? { adminId: req.adminId } : {};

    const bulkOps = updates.map(({ id, displayOrder }) => ({
      updateOne: {
        filter: { _id: id, ...filter },
        update: { $set: { displayOrder } },
      },
    }));

    await Solution.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: "Order updated" });
  } catch (error) {
    console.error("UPDATE SOLUTION ORDER ERROR:", error.message);
    res.status(500).json({ message: "Failed to update order" });
  }
};