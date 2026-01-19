const Page = require("../modal/pageSchema");
const { generateSlug } = require("../utils/slug");
const slugify = require("slugify");
// ➕ Add page
exports.addPage = async (req, res) => {
  try {
    const { title, shortDescription, description } = req.body;

    const slug = slugify(title, {
  lower: true,    // Convert to lowercase
  strict: true,   // Remove special chars
  trim: true      // Remove leading/trailing spaces
});

    const page = await Page.create({
      title,
      slug,
      shortDescription,
      description,
    });

    res.status(201).json({
      message: "Page created successfully",
      page,
    });
  } catch (error) {
    res.status(500).json({ message: "Page creation failed" });
  }
};

// 📄 Get all pages (admin)
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.status(200).json(pages);
  } catch {
    res.status(500).json({ message: "Failed to fetch pages" });
  }
};

// ✏️ Update page
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, shortDescription, description } = req.body;

    const slug = slugify(title, {
  lower: true,    // Convert to lowercase
  strict: true,   // Remove special chars
  trim: true      // Remove leading/trailing spaces
});

    const page = await Page.findByIdAndUpdate(
      id,
      { title, slug, shortDescription, description },
      { new: true }
    );

    res.status(200).json({
      message: "Page updated successfully",
      page,
    });
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};

// 🗑️ Delete page
exports.deletePage = async (req, res) => {
  try {
    await Page.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Page deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};

// 🔄 Toggle active
exports.togglePageStatus = async (req, res) => {
  const page = await Page.findById(req.params.id);
  page.isActive = !page.isActive;
  await page.save();

  res.status(200).json({
    message: page.isActive ? "Page enabled" : "Page disabled",
  });
};


exports.getPageBySlug = async (req, res) => {
  const { slug } = req.params;

  const page = await Page.findOne({
    slug,
    isActive: true,
  });

  if (!page) {
    return res.status(404).json({ message: "Page not found" });
  }

  res.status(200).json(page);
};
