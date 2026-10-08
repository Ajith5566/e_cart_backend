// 1) Load environment variables
require("dotenv").config();

// 2) Imports
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path"); // ✅ needed for static paths
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi    = require("swagger-ui-express");

// 3) Import router
const router = require("./Router/router");
const publicRouter = require("./Router/public_router"); 

// 4) Import DB connection
require("./DB/connection");

// 5) Create server
const cartServer = express();

// 6) Trust proxy (must be before middleware)
cartServer.set("trust proxy", true);

// 7) CORS
const allowedOrigins = [
  "https://mern-admin-sable.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4000",
  "https://mern-admin-express-api.onrender.com",
  "https://mernappadmin.phitanydev.in",
  "https://frontend.phitanydev.in",
  "https://admin.phitany.com"
];

cartServer.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / mobile (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // allow Vercel preview deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// 8) Parse JSON
cartServer.use(express.json({ limit: "10mb" }));
cartServer.use(express.urlencoded({ limit: "10mb", extended: true }));

// 9) Parse cookies
cartServer.use(cookieParser());

// 10) Static files — PUBLIC folders ONLY, mounted explicitly.
// ⚠️ NEVER mount the /uploads root: uploads/cv holds applicant
// resumes and must stay behind the authenticated download route.
// 10) Static files — PUBLIC folders ONLY
/* cartServer.get("/uploads/*", (req, res) => {
    const file = path.join("/home/u302045562/domains/uploads", req.params[0]);
    res.sendFile(file);
}); */
cartServer.use(
    "/uploads",
    express.static("/home/u302045562/domains/uploads")
); 
/* cartServer.use("/uploads/blogs",        express.static(path.join(__dirname, "uploads", "blogs"),        { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/banners",      express.static(path.join(__dirname, "uploads", "banners"),      { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/authors",      express.static(path.join(__dirname, "uploads", "authors"),      { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/testimonials", express.static(path.join(__dirname, "uploads", "testimonials"), { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/technologies", express.static(path.join(__dirname, "uploads", "technologies"), { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/services",     express.static(path.join(__dirname, "uploads", "services"),     { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/casestudies",  express.static(path.join(__dirname, "uploads", "casestudies"),  { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/clients",      express.static(path.join(__dirname, "uploads", "clients"),      { maxAge: "30d", immutable: true }));
cartServer.use("/uploads/industries", express.static(path.join(__dirname, "uploads", "industries"),{ maxAge: "30d", immutable: true }));
cartServer.use("/uploads/solutions", express.static(path.join(__dirname, "uploads", "solutions"),{ maxAge: "30d", immutable: true })); */
// ⚠️ NEVER add /uploads/cv — CVs stay behind the authenticated download route
// cartServer.use("/uploads/banners", express.static(path.join(__dirname, "uploads", "banners"), { maxAge: "30d", immutable: true }));


 
// 11) Swagger API docs
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title:       "Phitany Admin API",
      version:     "1.0.0",
      description: "REST API documentation for the Phitany admin panel",
    },
    servers: [
      { url: "http://localhost:4000",              description: "Local" },
      { url: "https://mernappadmin.phitanydev.in", description: "Production" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         "http",
          scheme:       "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    //security: [{ bearerAuth: [] }],
  },
  // ✅ scan docs folder only — router.js stays clean
  apis: [
    "./docs/paths/*.js",
    "./Router/public_router.js", // ✅ ADD
  ],
};
 
const swaggerSpec = swaggerJsdoc(swaggerOptions);
/* console.log("Swagger paths:");
console.log(Object.keys(swaggerSpec.paths).sort()); */

cartServer.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});
 
cartServer.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Phitany API Docs",
    swaggerOptions: {
      persistAuthorization: true, // keeps JWT token across page refreshes
    },
  })
);
 
// 11) Routes
cartServer.use(router);
cartServer.use(publicRouter);

// 12) 404 handler
cartServer.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 13) Global error handler
cartServer.use((err, _req, res, _next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// 14) Start server
const PORT = process.env.PORT || 4000;

cartServer.listen(PORT, () => {
  console.log(`Cart server running on port ${PORT}`);
});