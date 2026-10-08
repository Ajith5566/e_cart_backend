// scripts/seedSystemPages.js
require("dotenv").config();
require("../DB/connection");

const Page    = require("../modal/pageSchema");
const slugify = require("slugify");

const SYSTEM_PAGES = [
  "Home",
  "About Us",
  "Services",
  "Case Studies",
  "Industries",
  "Solutions",
  "Technologies",
  "Testimonials",
  "Insights",
  "Careers",
  "Contact Us",
  "Privacy Policy",
  "Terms and Conditions",
  "Clients"
].map((title) => ({
  title,
  slug:             slugify(title, { lower: true, strict: true }),
  shortDescription: "",
  description:      "",
  isSystem:         true,
  isActive:         true,
}));

const seed = async () => {
  try {
    for (const page of SYSTEM_PAGES) {
      await Page.findOneAndUpdate(
        { slug: page.slug },
        { $setOnInsert: page },
        { upsert: true }
      );
      console.log(`✅ Seeded: "${page.title}" (${page.slug})`);
    }
    console.log("✅ System pages seed complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();