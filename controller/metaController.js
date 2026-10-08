// controllers/meta.controller.js
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");
// ================= GET META =================

exports.getMeta = async (req, res) => {
  try {

    const { entity_type, entity_id } = req.params;

    const meta = await Meta.findOne({ entity_type, entity_id });

    if (!meta) {
      return res.status(404).json({ message: "No meta found" });
    }

    res.status(200).json(meta);

  } catch (error) {

    console.error("Get meta error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};


// ================= SAVE META (Create or Update) =================

exports.saveMeta = async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const newSlug = req.body.slug?.toLowerCase().trim();
 
    // ---------- 1. Check slug is not taken by ANOTHER entity ----------
    if (newSlug) {
      const slugTakenByCurrent = await Meta.findOne({
        slug: newSlug,
        entity_type,
        entity_id: { $ne: entity_id },
      });
 
      const slugTakenByHistory = await SlugHistory.findOne({
        old_slug: newSlug,
        entity_type,
        entity_id: { $ne: entity_id },
      });
 
      if (slugTakenByCurrent || slugTakenByHistory) {
        return res.status(409).json({
          message: "This slug is already in use by another item",
        });
      }
    }
 
    // ---------- 2. Get the existing meta BEFORE updating ----------
    const existingMeta = await Meta.findOne({ entity_type, entity_id });
 
    // ---------- 3. If slug changed, archive the old one ----------
    if (
      existingMeta &&
      existingMeta.slug &&
      newSlug &&
      existingMeta.slug !== newSlug
    ) {
      // upsert so a slug that was used twice doesn't throw a duplicate error
      await SlugHistory.findOneAndUpdate(
        { old_slug: existingMeta.slug, entity_type },
        { old_slug: existingMeta.slug, entity_type, entity_id },
        { upsert: true }
      );
    }
 
    // ---------- 4. If the entity re-claims one of its OWN old slugs,
    //             remove it from history (current slug always wins) ----------
    if (newSlug) {
      await SlugHistory.deleteOne({
        old_slug: newSlug,
        entity_type,
        entity_id,
      });
    }
 
    // ---------- 5. Save meta ----------
    const meta = await Meta.findOneAndUpdate(
      { entity_type, entity_id },
      { ...req.body, slug: newSlug, entity_type, entity_id },
      { new: true, upsert: true }
    );
 
    res.status(200).json({ message: "Meta saved successfully", meta });
  } catch (error) {
    console.error("Save meta error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
 
 


// ================= DELETE META =================

exports.deleteMeta = async (req, res) => {
  try {

    const { entity_type, entity_id } = req.params;

    const meta = await Meta.findOneAndDelete({ entity_type, entity_id });

    if (!meta) {
      return res.status(404).json({ message: "No meta found to delete" });
    }

    res.status(200).json({
      message: "Meta deleted successfully"
    });

  } catch (error) {

    console.error("Delete meta error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};