// utils/slugHelper.js
const Meta = require("../modal/metaSchema");
const SlugHistory = require("../modal/slugHistorySchema");

/**
 * Call BEFORE saving the new meta.
 * - Archives the old slug to SlugHistory if it changed
 * - Removes the new slug from history if the entity re-claims its own old slug
 */
async function archiveSlugIfChanged(entity_type, entity_id, newSlug) {
  if (!newSlug) return;

  newSlug = newSlug.toLowerCase().trim();

  const existingMeta = await Meta.findOne({ entity_type, entity_id });

  // slug changed → archive the old one
  if (existingMeta && existingMeta.slug && existingMeta.slug !== newSlug) {
    await SlugHistory.findOneAndUpdate(
      { old_slug: existingMeta.slug, entity_type },
      { old_slug: existingMeta.slug, entity_type, entity_id },
      { upsert: true }
    );
    console.log(`[slug] archived "${existingMeta.slug}" → new slug "${newSlug}" (${entity_type} ${entity_id})`);
  }

  // entity re-claims its own old slug → remove it from history
  await SlugHistory.deleteOne({ old_slug: newSlug, entity_type, entity_id });
}

async function archiveSlugChange(entity_type,_id, newSlug) {
  if (!newSlug) return;

  newSlug = newSlug.toLowerCase().trim();

  const existingMeta = await Meta.findOne({ entity_type,_id });

  // slug changed → archive the old one
  if (existingMeta && existingMeta.slug && existingMeta.slug !== newSlug) {
    await SlugHistory.findOneAndUpdate(
      { old_slug: existingMeta.slug, entity_type },
      { old_slug: existingMeta.slug, entity_type,entity_id:_id },
      { upsert: true }
    );
    console.log(`[slug] archived "${existingMeta.slug}" → new slug "${newSlug}" (${entity_type} ${_id})`);
  }

  // entity re-claims its own old slug → remove it from history
  await SlugHistory.deleteOne({ old_slug: newSlug, entity_type,_id });
}
module.exports = { archiveSlugIfChanged,archiveSlugChange };