const { publicPath } = require("../utils/filestorage");

exports.uploadEditorImage = async (req, res) => {
  try {
    
    const file = req.files?.image?.[0] || req.file;
      console.log("FILE DETAILS:", {
      filename:        file?.filename,
      originalname:    file?.originalname,
      path:            file?.path,
      destination:     file?.destination,
    });
    if (!file) return res.status(400).json({ message: "No image provided" });

    const path = publicPath("editor", file);

    res.status(200).json({ 
      success: true, 
      url: path,  // ✅ return relative path — e.g. /uploads/editor/xyz.jpg
    });
  } catch (error) {
    console.error("EDITOR IMAGE UPLOAD ERROR:", error.message);
    res.status(500).json({ message: "Image upload failed" });
  }
};