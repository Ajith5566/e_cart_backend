const calculateReadTime = (contentBlocks = []) => {
  const allText = contentBlocks
    .map((block) => {
      if (block.type === "editor" || block.type === "quote") {
        return (block.html || "").replace(/<[^>]*>/g, " ");
      }
      if (block.type === "gallery") {
        return (block.images || []).map((img) => img.caption || "").join(" ");
      }
      return "";
    })
    .join(" ");

  const wordCount = allText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

module.exports = calculateReadTime;