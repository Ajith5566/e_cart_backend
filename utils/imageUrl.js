// utils/imageUrl.js
const imageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path; // already absolute
  const base = process.env.BASE_URL || "https://mernappadmin.phitanydev.in";
  return `${base}${path}`;
};

module.exports = imageUrl;