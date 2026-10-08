const express             = require("express");

const caseStudyController = require("../public_controller/caseStudyController");
const faqController = require("../public_controller/faqController");
const serviceController = require("../public_controller/serviceController");
const clientController = require("../public_controller/clientController");
const technologyController = require("../public_controller/technologyController");
const settingsController = require("../public_controller/settingsController");
const testimonialController = require("../public_controller/testimonialController");
const blogController = require("../public_controller/blogController");
const bannerController = require("../public_controller/bannerController");
const pageController = require("../public_controller/pageController");
const jobController = require("../public_controller/jobController");
const router              = express.Router(); 
const careerController = require("../public_controller/careerController");
const uploadCv = require("../middleware/cvUpload");
const contactController = require("../public_controller/contactController");
const solutionController = require("../public_controller/solutionController");
const industryController = require("../public_controller/industryController");
const searchController = require("../public_controller/searchController");
const sitemapController = require("../public_controller/sitemapController");


// ── PUBLIC case study routes ─────────────────────────────────



// specific named routes BEFORE /:slug to avoid conflicts
router.get("/case-studies/featured", caseStudyController.getFeaturedCaseStudies);
router.get("/case-studies/filters",  caseStudyController.getCaseStudyFilters);
router.get("/case-studies",          caseStudyController.getPublicCaseStudies);
router.get("/case-studies/:slug",    caseStudyController.getPublicCaseStudyBySlug);
router.get("/case-studies/:slug/adjacent", caseStudyController.getAdjacentCaseStudies);

// ── PUBLIC FAQ ───────────────────────────────────────────────
router.get("/faqs", faqController.getPublicFaqs);

// featured and specific routes BEFORE /:slug
router.get("/services/featured", serviceController.getFeaturedServices);
router.get("/services",          serviceController.getPublicServices);
router.get("/services/:slug",    serviceController.getPublicServiceBySlug);

//client public
router.get("/clients", clientController.getPublicClients);

//technology
router.get("/technologies",       technologyController.getPublicTechnologies);


//settings
router.get("/settings", settingsController.getPublicSettings);


//testimonials
router.get("/testimonials", testimonialController.getPublicTestimonials);


//blogs
router.get("/blogs/author/:authorId", blogController.getPublicBlogsByAuthor)
router.get("/blogs",               blogController.getPublicBlogs);
router.get("/blogs/:slug/related", blogController.getRelatedBlogs);  // BEFORE /:slug
router.get("/blogs/:slug",         blogController.getPublicBlogBySlug);
router.get("/authors/:id", blogController.getPublicAuthorById);


//banner
router.get("/banners", bannerController.getPublicBanners);


//page
router.get("/pages/:slug", pageController.getPublicPageBySlug);

//job


router.get("/jobs",     jobController.getPublicJobs);
router.get("/jobs/:id", jobController.getPublicJobById);

//job application


router.post("/careers/apply", uploadCv, careerController.submitApplication);

//contact us

router.post("/contact", contactController.submitContact);

//solutions

router.get("/solutions", solutionController.getPublicSolutions);

//industry
router.get("/industries",       industryController.getPublicIndustries);

//search
router.get("/search", searchController.search);



router.get("/sitemap.xml", sitemapController.getSitemapXml);  // ✅ XML for Google
router.get("/sitemap",     sitemapController.getSitemapJson); // ✅ JSON for API docs

module.exports = router;