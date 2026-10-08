// Router/router.js — CORRECTED
// Key fix: banner bulk routes moved BEFORE any /:id banner routes

const express = require("express");
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const checkPermission = require("../middleware/checkPermission");
const pageController = require("../controller/pageController");
const pageImageUpload = require("../middleware/pageImageUpload");
const adminUserController = require("../controller/adminUserController");
const categoryController = require("../controller/categoryController");
const blogController = require("../controller/blogController");
const blogImageUpload = require("../middleware/blogImageUpload");
const testimonialController = require("../controller/testmonialController");
const testimonialImageUpload = require("../middleware/testimonialImageUpload");
const bannerController = require("../controller/bannerController");
const bannerImageUpload = require("../middleware/bannerImageUpload");
const loginHistoryController = require("../controller/loginHistoryController");
const settingsController = require("../controller/settingsController");
const settingsImageUpload = require("../middleware/settingsImageUpload");
const permissionController = require("../controller/permissionController");
const authorController = require("../controller/authorController");
const authorImageUpload = require("../middleware/authorImageUpload");
const contactController = require("../controller/contactController");
const multerconfig = require("../middleware/multerMiddleware");
const authorize = require("../middleware/authorize");
const metaController = require("../controller/metaController");
const jobController = require("../controller/jobController");
const careerController = require("../controller/careerController");
const technologyController   = require("../controller/technologyController");
const technologyLogoUpload   = require("../middleware/technologyLogoUpload");
const serviceImageUpload = require("../middleware/serviceImageUpload.js");
const serviceController = require("../controller/serviceController");
const industryImageUpload = require("../middleware/industryImageUpload");
const industryController = require("../controller/industryController");
const solutionController = require("../controller/solutionController");
const solutionImageUpload = require("../middleware/solutionImageUpload");
const caseStudyController = require("../controller/caseStudyController");
const caseStudyUpload     = require("../middleware/caseStudyUpload");
const clientLogoUpload = require("../middleware/clientLogoUpload");
const clientController = require("../controller/clientController");
const faqController = require("../controller/faqController");
const uploadCv = require("../middleware/cvUpload");
const editorImageUpload    = require("../middleware/editorImageUpload");
const editorImageController = require("../controller/editorImageController");
const dashboardController = require("../controller/dashboardController");

const productImageFields = multerconfig.fields([
  { name: "images",        maxCount: 10 },
  { name: "og_image",      maxCount: 1  },
  { name: "twitter_image", maxCount: 1  },
]);

const SingleImageFields = multerconfig.fields([
  { name: "image",         maxCount: 1 },
  { name: "og_image",      maxCount: 1 },
  { name: "twitter_image", maxCount: 1 },
]);

const router = express.Router();



//dashboard
router.get("/admin/dashboard/overview", jwtMiddleware, dashboardController.getDashboardOverview);



//editor image path
router.post(
  "/admin/upload/editor-image",
  jwtMiddleware,
  editorImageUpload,
  editorImageController.uploadEditorImage
);
// ============================================================
// AUTH
// ============================================================
router.post("/user/register", userController.register);
router.post("/user/login", userController.login);
router.post("/admin/login", adminUserController.adminuserslogin);
router.post("/admin/refresh", adminUserController.refreshToken);
router.get("/admin/me", jwtMiddleware, adminUserController.checkAdminAuth);
router.post("/admin/logout", adminUserController.logout);
router.post("/forgot-password", adminUserController.forgotPassword);
router.post("/admin/reset-password/:token", adminUserController.resetPassword);
router.get("/admin/reset-password/:token/verify", adminUserController.verifyResetToken);

// ============================================================
// ADMIN USERS
// ============================================================
router.post("/admin_users/register", jwtMiddleware, authorize("super_admin"), adminUserController.createAdminUser);
router.get("/admin_user/list", jwtMiddleware, authorize("super_admin"), adminUserController.getAllUsers);
router.delete("/admin/user/delete/:id", jwtMiddleware, authorize("super_admin"), adminUserController.deleteAdminUser);
router.put("/admin/users/:id/toggle", jwtMiddleware, authorize("super_admin"), adminUserController.toggleAdmin_User_Status);
router.put("/admin/user/update/:id", jwtMiddleware, adminUserController.updateAdmin_user);
router.get("/userByid/:id", jwtMiddleware, adminUserController.getuserbyId);
router.get("/admin/profile", jwtMiddleware, adminUserController.getProfile);
router.put("/admin/profile/update", jwtMiddleware, adminUserController.updateProfile);
router.get("/admin/permission/me", jwtMiddleware, adminUserController.checkAdminAuth);

// ============================================================
// USERS (public)
// ============================================================
router.get("/admin/dash/users", userController.getAllusers);
router.put("/admin/dash/blockUser/:id", jwtMiddleware, userController.toggleUserBlock);

// ============================================================
// LOGIN HISTORY
// ============================================================
router.get("/admin/login-history", jwtMiddleware, authorize("super_admin"), loginHistoryController.getLoginHistory);

// ============================================================
// SETTINGS
// ============================================================
router.get("/admin/settings", jwtMiddleware, authorize("super_admin"), settingsController.getSettings);
router.post("/admin/settings", jwtMiddleware, authorize("super_admin"), settingsImageUpload, settingsController.saveSettings);

// ============================================================
// PERMISSIONS
// ============================================================
router.get("/admin/permissions/modules", jwtMiddleware, authorize("super_admin"), permissionController.getModules);
router.get("/admin/permissions/:role", jwtMiddleware, authorize("super_admin"), permissionController.getPermissionsByRole);
router.put("/admin/permissions/:role", jwtMiddleware, authorize("super_admin"), permissionController.updatePermissionsByRole);

// ============================================================
// META
// ============================================================
router.get("/meta/:entity_type/:entity_id", metaController.getMeta);
router.post("/meta/:entity_type/:entity_id", metaController.saveMeta);
router.delete("/meta/:entity_type/:entity_id", metaController.deleteMeta);

// ============================================================
// PRODUCTS
// ============================================================
router.get("/admin/products", jwtMiddleware, checkPermission("products", "view"), productController.getAllproducts);
router.get("/productsByid/:id", jwtMiddleware, checkPermission("products", "view"), productController.getProductById);
router.get("/products/slug/:slug", productController.getProductBySlug);
router.post("/add-product", jwtMiddleware, checkPermission("products", "create"), productImageFields, productController.addproject);
router.put("/admin/productUpdate/:id", jwtMiddleware, checkPermission("products", "update"), productImageFields, productController.updateProduct);
router.delete("/admin/product/:id", jwtMiddleware, checkPermission("products", "delete"), productController.deleteProduct);
router.put("/admin/product/:id/toggle", jwtMiddleware, checkPermission("products", "status"), productController.toggleProductstatus);

// ============================================================
// PAGES — bulk BEFORE /:id
// ============================================================
router.patch("/pages/bulk-status", jwtMiddleware, checkPermission("pages", "edit"), pageController.bulkTogglePages);
router.post("/pages/bulk-delete", jwtMiddleware, checkPermission("pages", "delete"), pageController.bulkDeletePages);
router.post("/admin/pages",     jwtMiddleware, checkPermission("pages", "create"), pageImageUpload, pageController.addPage);
/* router.post("/admin/pages", jwtMiddleware, checkPermission("pages", "create"), productImageFields, pageController.addPage); */
router.get("/admin/pages", jwtMiddleware, checkPermission("pages", "view"), pageController.getAllPages);
router.get("/pagebyid/:id", jwtMiddleware, checkPermission("pages", "view"), pageController.getPageById);
/* router.put("/admin/pages/:id", jwtMiddleware, checkPermission("pages", "update"), productImageFields, pageController.updatePage); */
router.put("/admin/pages/:id",  jwtMiddleware, checkPermission("pages", "update"), pageImageUpload, pageController.updatePage);
router.delete("/admin/pages/:id", jwtMiddleware, checkPermission("pages", "delete"), pageController.deletePage);
router.put("/admin/pages/:id/toggle", jwtMiddleware, checkPermission("pages", "status"), pageController.togglePageStatus);
router.get("/page/:slug", pageController.getPageBySlug);

// ============================================================
// CATEGORY
// ============================================================
router.post("/product/category", jwtMiddleware, checkPermission("category", "create"), SingleImageFields, categoryController.addCategory);
router.get("/get/categories", jwtMiddleware, checkPermission("category", "view"), categoryController.getAllCategories);
router.get("/categoryByid/:id", jwtMiddleware, checkPermission("category", "view"), categoryController.getCategoryById);
router.put("/admin/CategoryUpdate/:id", jwtMiddleware, checkPermission("category", "update"), SingleImageFields, categoryController.updateCategory);
router.put("/admin/category/:id/toggle", jwtMiddleware, checkPermission("category", "status"), categoryController.toggleCategoryStatus);

// ============================================================
// BLOGS — bulk BEFORE /:id
// ============================================================
router.patch("/admin/blogs/bulk-status", jwtMiddleware, checkPermission("blog", "status"), blogController.bulkToggleBlogs);
router.post("/admin/blogs/bulk-delete", jwtMiddleware, checkPermission("blog", "delete"), blogController.bulkDeleteBlogs);
router.post("/blogs", jwtMiddleware, checkPermission("blog", "create"), blogImageUpload, blogController.addBlogs);
router.patch("/admin/blogs/:id/faqs", jwtMiddleware, checkPermission("blog", "update"), blogController.updateBlogFaqs);
router.get("/get/blogs", jwtMiddleware, checkPermission("blog", "view"), blogController.getAllBlogs);
router.get("/blogByid/:id", jwtMiddleware, checkPermission("blog", "view"), blogController.getblogById);
router.put("/admin/blog/:id/toggle", jwtMiddleware, checkPermission("blog", "status"), blogController.toggleBlogStatus);
router.put("/admin/Updateblog/:id", jwtMiddleware, checkPermission("blog", "update"), blogImageUpload, blogController.updateBlogs);
router.delete("/admin/blog/delete/:id", jwtMiddleware, checkPermission("blog", "delete"), blogController.deleteBlog);
router.post("/admin/blog/:id/remove-block-image", jwtMiddleware, checkPermission("blog", "update"), blogController.removeBlogBlockImage);
 
// ✅ NEW — dedicated publish / unpublish action, separate from a full content edit
router.patch("/admin/blog/:id/publication-status", jwtMiddleware, checkPermission("blog", "status"), blogController.setBlogPublicationStatus);

// ============================================================
// TESTIMONIALS
// ============================================================
// bulk — BEFORE /:id
router.patch("/admin/testimonials/bulk-status", jwtMiddleware, checkPermission("testimonials","status"), testimonialController.bulkToggleTestimonials);
router.post("/admin/testimonials/bulk-delete",  jwtMiddleware, checkPermission("testimonials","delete"), testimonialController.bulkDeleteTestimonials);
router.patch("/admin/testimonials/order",jwtMiddleware, checkPermission("testimonials", "update"),testimonialController.updateTestimonialsOrder);
 
// existing routes — swap middleware
router.post("/testimonials",                jwtMiddleware, checkPermission("testimonials","create"), testimonialImageUpload, testimonialController.addTestimonials);
router.get("/get/testimonials",             jwtMiddleware, checkPermission("testimonials","view"),   testimonialController.getAlltestimonials);
router.get("/testimonialByid/:id",          jwtMiddleware, checkPermission("testimonials","view"),   testimonialController.getTestimonialbyId);
router.put("/admin/Updatetestimonial/:id",  jwtMiddleware, checkPermission("testimonials","update"), testimonialImageUpload, testimonialController.updatetestimonials);
router.put("/admin/testimonial/:id/toggle", jwtMiddleware, checkPermission("testimonials","status"), testimonialController.toggletestimonialsStatus);
router.delete("/admin/testimonial/delete/:id", jwtMiddleware, checkPermission("testimonials","delete"), testimonialController.deletetestimonial);


// ============================================================
// BANNERS — bulk BEFORE /:id  ✅ FIXED ORDER
// ============================================================
router.patch("/admin/banners/order",jwtMiddleware,checkPermission("banner", "update"),bannerController.updateBannerOrder);
router.patch("/admin/banners/bulk-status", jwtMiddleware, checkPermission("banner", "status"), bannerController.bulkToggleBanners);
router.post("/admin/banners/bulk-delete", jwtMiddleware, checkPermission("banner", "delete"), bannerController.bulkDeleteBanners);
router.post("/banner", jwtMiddleware, checkPermission("banner", "create"), bannerImageUpload, bannerController.addBanners);
router.get("/get/banners", jwtMiddleware, checkPermission("banner", "view"), bannerController.getAllBanners);
router.get("/bannerByid/:id", jwtMiddleware, checkPermission("banner", "view"), bannerController.getbannerById);
router.put("/admin/Updatebanner/:id", jwtMiddleware, checkPermission("banner", "update"), bannerImageUpload, bannerController.updateBanners);
router.patch("/admin/banner/:id/toggle", jwtMiddleware, checkPermission("banner", "status"), bannerController.toggleBannerStatus);
router.delete("/admin/banner/delete/:id", jwtMiddleware, checkPermission("banner", "delete"), bannerController.deleteBanner);

// ============================================================
// AUTHORS
// ============================================================
// bulk — BEFORE any /:id author routes
router.patch("/admin/authors/bulk-status", jwtMiddleware, checkPermission("author","status"), authorController.bulkToggleAuthors);
router.post("/admin/authors/bulk-delete",  jwtMiddleware, checkPermission("author","delete"), authorController.bulkDeleteAuthors);
 
// existing author routes — swap SingleImageFields → authorImageUpload
router.post("/author",               jwtMiddleware, checkPermission("author","create"), authorImageUpload, authorController.addAuthor);
router.get("/get/authors",           jwtMiddleware, checkPermission("author","view"),   authorController.getAllauthors);
router.get("/authorByid/:id",        jwtMiddleware, checkPermission("author","view"),   authorController.getAuthorById);
router.put("/admin/updateAuthor/:id",jwtMiddleware, checkPermission("author","update"), authorImageUpload, authorController.updateauthors);
router.put("/admin/author/:id/toggle",jwtMiddleware, checkPermission("author","status"), authorController.toggleauthorStatus);
router.delete("/admin/author/delete/:id", jwtMiddleware, checkPermission("author","delete"), authorController.deleteauthor);

// ============================================================
// CONTACT ENQUIRIES
// ============================================================
router.post("/contact", contactController.submitContact);
router.post("/contacts/bulk-delete", jwtMiddleware, contactController.bulkDeleteContacts);
router.get("/admin/contactsus", jwtMiddleware, contactController.getAllContacts);
router.get("/enquiryByid/:id", jwtMiddleware, contactController.getEnquirybyId);
router.delete("/admin/contacts/delete/:id", jwtMiddleware, contactController.deleteEnquiry);

// ============================================================
// CAREERS — bulk BEFORE /:id
// ============================================================
router.post("/careers/apply", uploadCv, careerController.submitApplication);
router.post("/careers/bulk-delete", jwtMiddleware, careerController.bulkDeleteApplications);
router.get("/careers", jwtMiddleware, careerController.getAllApplications);
router.get("/careers/:id/cv", careerController.downloadCv);
router.get("/careers/:id", jwtMiddleware, careerController.getApplicationById);
router.patch("/careers/:id/status", jwtMiddleware, careerController.updateApplicationStatus);
router.delete("/careers/:id", jwtMiddleware, careerController.deleteApplication);

// ============================================================
// JOBS — bulk BEFORE /:id
// ============================================================
router.get("/jobs/active", jobController.getActiveJobs);
router.patch("/jobs/bulk-status", jwtMiddleware, checkPermission("jobs", "edit"), jobController.bulkToggleJobs);
router.post("/jobs/bulk-delete", jwtMiddleware, checkPermission("jobs", "delete"), jobController.bulkDeleteJobs);
router.post("/jobs", jwtMiddleware, checkPermission("jobs", "create"), jobController.addJob);
router.get("/admin/jobs", jwtMiddleware, checkPermission("jobs", "view"), jobController.getAllJobs);
router.get("/jobs/filter", jwtMiddleware, checkPermission("jobs", "view"), jobController.getAllJobsfilter);
router.get("/admin/jobs/:id", jwtMiddleware, checkPermission("jobs", "view"), jobController.getJobById);
router.put("/jobs/:id", jwtMiddleware, checkPermission("jobs", "edit"), jobController.updateJob);
router.patch("/jobs/:id/toggle", jwtMiddleware, checkPermission("jobs", "edit"), jobController.toggleJobStatus);
router.delete("/jobs/:id", jwtMiddleware, checkPermission("jobs", "delete"), jobController.deleteJob);


// ============================================================
// TECHNOLOGIES — bulk BEFORE /:id
// ============================================================
router.patch("/admin/technologies/order",jwtMiddleware,checkPermission("technology", "update"),technologyController.updateTechnologyOrder);
router.patch("/admin/technologies/bulk-status", jwtMiddleware, checkPermission("technology","status"), technologyController.bulkToggleTechnologies);
router.post("/admin/technologies/bulk-delete",  jwtMiddleware, checkPermission("technology","delete"), technologyController.bulkDeleteTechnologies);
 
router.post("/admin/technologies",            jwtMiddleware, checkPermission("technology","create"), technologyLogoUpload, technologyController.addTechnology);
router.get("/admin/technologies",             jwtMiddleware, checkPermission("technology","view"),   technologyController.getAllTechnologies);
router.get("/admin/technologies/:id",         jwtMiddleware, checkPermission("technology","view"),   technologyController.getTechnologyById);
router.put("/admin/technologies/:id",         jwtMiddleware, checkPermission("technology","update"), technologyLogoUpload, technologyController.updateTechnology);
router.patch("/admin/technologies/:id/toggle",jwtMiddleware, checkPermission("technology","status"), technologyController.toggleTechnologyStatus);
router.delete("/admin/technologies/:id",      jwtMiddleware, checkPermission("technology","delete"), technologyController.deleteTechnology);


// ============================================================
// SERVICES — bulk BEFORE /:id
// ============================================================

router.post("/admin/services", jwtMiddleware, checkPermission("service", "create"), serviceImageUpload, serviceController.addService);
router.get("/admin/services", jwtMiddleware, checkPermission("service", "view"), serviceController.getAllServices);
 
// bulk routes registered before the "/:id" routes below
router.patch("/admin/services/bulk-status", jwtMiddleware, checkPermission("service", "status"), serviceController.bulkToggleServices);
router.post("/admin/services/bulk-delete", jwtMiddleware, checkPermission("service", "delete"), serviceController.bulkDeleteServices);
 
router.get("/admin/services/:id", jwtMiddleware, checkPermission("service", "view"), serviceController.getServiceById);
router.get("/admin/services/:id/relations", jwtMiddleware, checkPermission("service", "view"), serviceController.getServiceRelations);
router.put("/admin/services/:id", jwtMiddleware, checkPermission("service", "update"), serviceImageUpload, serviceController.updateService);
router.patch("/admin/services/:id/faqs", jwtMiddleware, checkPermission("service", "update"), serviceController.updateServiceFaqs);
router.patch("/admin/services/:id/toggle", jwtMiddleware, checkPermission("service", "status"), serviceController.toggleServiceStatus);
router.delete("/admin/services/:id", jwtMiddleware, checkPermission("service", "delete"), serviceController.deleteService);
router.patch("/admin/services/order", jwtMiddleware, checkPermission("service", "update"), serviceController.updateServiceOrder);
 
// ============================================================
// INDUSTIRES — bulk BEFORE /:id
// ============================================================

router.patch("/admin/industries/bulk-status", jwtMiddleware, checkPermission("industry", "status"), industryController.bulkToggleIndustries);
router.post("/admin/industries/bulk-delete",  jwtMiddleware, checkPermission("industry", "delete"), industryController.bulkDeleteIndustries);

router.post("/admin/industries",             jwtMiddleware, checkPermission("industry", "create"), industryImageUpload, industryController.addIndustry);
router.get("/admin/industries",              jwtMiddleware, checkPermission("industry", "view"),   industryController.getAllIndustries);
router.get("/admin/industries/:id",          jwtMiddleware, checkPermission("industry", "view"),   industryController.getIndustryById);
router.put("/admin/industries/:id",          jwtMiddleware, checkPermission("industry", "update"), industryImageUpload, industryController.updateIndustry);
router.patch("/admin/industries/:id/toggle", jwtMiddleware, checkPermission("industry", "status"), industryController.toggleIndustryStatus);
router.delete("/admin/industries/:id",       jwtMiddleware, checkPermission("industry", "delete"), industryController.deleteIndustry);


// ============================================================
// SOLUTIONS — bulk BEFORE /:id
// ============================================================
router.post("/solutions", jwtMiddleware, checkPermission("solution", "create"), solutionImageUpload, solutionController.addSolution);
router.get("/get/solutions", jwtMiddleware, checkPermission("solution", "view"), solutionController.getAllSolutions);
router.get("/solutionById/:id", jwtMiddleware, checkPermission("solution", "view"), solutionController.getSolutionById);
router.patch("/admin/solutions/order", jwtMiddleware, checkPermission("solution", "update"), solutionController.updateSolutionOrder);
router.put("/admin/updateSolution/:id", jwtMiddleware, checkPermission("solution", "update"), solutionImageUpload, solutionController.updateSolution);
router.put("/admin/solution/:id/toggle", jwtMiddleware, checkPermission("solution", "status"), solutionController.toggleSolutionStatus);
router.delete("/admin/solution/delete/:id", jwtMiddleware, checkPermission("solution", "delete"), solutionController.deleteSolution);
router.patch("/admin/solutions/bulk-status", jwtMiddleware, checkPermission("solution", "status"), solutionController.bulkToggleSolutions);
router.post("/admin/solutions/bulk-delete", jwtMiddleware, checkPermission("solution", "delete"), solutionController.bulkDeleteSolutions);

// ============================================================
// Case STUDY — bulk BEFORE /:id
// ============================================================

router.patch("/admin/case-studies/order",jwtMiddleware,checkPermission("casestudy", "update"),caseStudyController.updateCaseStudyOrder);

router.patch("/admin/case-studies/bulk-status", jwtMiddleware, checkPermission("casestudy","status"), caseStudyController.bulkToggleCaseStudies);
router.post("/admin/case-studies/bulk-delete",  jwtMiddleware, checkPermission("casestudy","delete"), caseStudyController.bulkDeleteCaseStudies);
router.get("/admin/case-studies/available", jwtMiddleware, checkPermission("casestudy", "view"), caseStudyController.getAvailableCaseStudies);
 
router.post("/admin/case-studies",                     jwtMiddleware, checkPermission("casestudy","create"), caseStudyUpload, caseStudyController.addCaseStudy);
router.get("/admin/case-studies",                      jwtMiddleware, checkPermission("casestudy","view"),   caseStudyController.getAllCaseStudies);
router.get("/admin/case-studies/:id",                  jwtMiddleware, checkPermission("casestudy","view"),   caseStudyController.getCaseStudyById);
router.put("/admin/case-studies/:id",                  jwtMiddleware, checkPermission("casestudy","update"), caseStudyUpload, caseStudyController.updateCaseStudy);
router.patch("/admin/case-studies/:id/toggle",         jwtMiddleware, checkPermission("casestudy","status"), caseStudyController.toggleCaseStudyStatus);
router.delete("/admin/case-studies/:id",               jwtMiddleware, checkPermission("casestudy","delete"), caseStudyController.deleteCaseStudy);
router.delete("/admin/case-studies/:id/gallery",       jwtMiddleware, checkPermission("casestudy","update"), caseStudyController.removeGalleryImage);



// ============================================================
// Client module — bulk BEFORE /:id
// ============================================================
router.patch("/admin/clients/bulk-status", jwtMiddleware, checkPermission("client", "status"), clientController.bulkToggleClients);
router.post("/admin/clients/bulk-delete",  jwtMiddleware, checkPermission("client", "delete"), clientController.bulkDeleteClients);

router.post("/admin/clients",             jwtMiddleware, checkPermission("client", "create"), clientLogoUpload, clientController.addClient);
router.get("/admin/clients",              jwtMiddleware, checkPermission("client", "view"),   clientController.getAllClients);
router.get("/admin/clients/:id",          jwtMiddleware, checkPermission("client", "view"),   clientController.getClientById);
router.put("/admin/clients/:id",          jwtMiddleware, checkPermission("client", "update"), clientLogoUpload, clientController.updateClient);
router.patch("/admin/clients/:id/toggle", jwtMiddleware, checkPermission("client", "status"), clientController.toggleClientStatus);
router.delete("/admin/clients/:id",       jwtMiddleware, checkPermission("client", "delete"), clientController.deleteClient);
router.patch("/admin/clients/order", jwtMiddleware, checkPermission("client", "update"), clientController.updateClientOrder);



// ============================================================
// FAQ module — bulk BEFORE /:id
// ============================================================

router.post("/admin/faqs", jwtMiddleware, checkPermission("faq", "create"), faqController.addFaq);
router.get("/admin/faqs", jwtMiddleware, checkPermission("faq", "view"), faqController.getAllFaqs);
router.patch("/admin/faqs/order",jwtMiddleware, checkPermission("faq", "update"),faqController.updateFaqOrder);
 
// bulk routes registered before the "/:id" routes below
router.patch("/admin/faqs/bulk-status", jwtMiddleware, checkPermission("faq", "status"), faqController.bulkToggleFaqs);
router.post("/admin/faqs/bulk-delete", jwtMiddleware, checkPermission("faq", "delete"), faqController.bulkDeleteFaqs);
 
router.get("/admin/faqs/:id", jwtMiddleware, checkPermission("faq", "view"), faqController.getFaqById);
router.put("/admin/faqs/:id", jwtMiddleware, checkPermission("faq", "update"), faqController.updateFaq);
router.patch("/admin/faqs/:id/toggle", jwtMiddleware, checkPermission("faq", "status"), faqController.toggleFaqStatus);
router.delete("/admin/faqs/:id", jwtMiddleware, checkPermission("faq", "delete"), faqController.deleteFaq);
 


module.exports = router;