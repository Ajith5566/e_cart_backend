// utils/resolveImageUpdate.js
const cloudinary = require("../Config/cloudinary");

async function resolveImageUpdate({ existingImage, currentImage, newFiles }) {
  let finalImage = currentImage; // default: keep current

  if (newFiles && newFiles.length > 0) {
    // new image uploaded — delete old, use new
    if (currentImage) {
      const publicId = currentImage.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    finalImage = newFiles[0].path;

  } else if (existingImage === "") {
    // image explicitly removed, no replacement uploaded
    if (currentImage) {
      const publicId = currentImage.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    finalImage = "";

  } else if (existingImage) {
    // unchanged — kept existing image
    finalImage = existingImage;
  }

  return finalImage;
}

module.exports = resolveImageUpdate;