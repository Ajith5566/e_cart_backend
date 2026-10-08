// scripts/seedSystemJobs.js
// Run once: node scripts/seedSystemJobs.js
// Creates the two locked CTA records in the jobs collection.
// Safe to run multiple times — uses upsert so it won't duplicate.

require("dotenv").config();
require("../DB/connection");

const Job = require("../modal/jobSchema");

const SYSTEM_JOBS = [
  {
    _id:         "000000000000000000000001", // fixed ObjectId — easy to reference
    title:       "Your skill not listed?",
    jobType:     "skill-not-listed",
    experience:  "-",
    location:    "-",
    description: "We are always looking for talented people. Get in touch with us.",
    skills:      [],
    isSystem:    true,
    isActive:    true,
    adminId:     "system",
  },
  {
    _id:         "000000000000000000000002", // fixed ObjectId — easy to reference
    title:       "Looking for internship?",
    jobType:     "internship-cta",
    experience:  "-",
    location:    "-",
    description: "We offer internship programs for motivated students. Apply here.",
    skills:      [],
    isSystem:    true,
    isActive:    true,
    adminId:     "system",
  },
];

const seed = async () => {
  try {
    for (const job of SYSTEM_JOBS) {
      await Job.findByIdAndUpdate(
        job._id,
        { $setOnInsert: job }, // only insert if not exists — never overwrite
        { upsert: true, new: true }
      );
      console.log(`✅ System job seeded: "${job.title}" (_id: ${job._id})`);
    }
    console.log("✅ System jobs seed complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    process.exit(1);
  }
};

seed();