const fs = require("fs");
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsdoc(options);

fs.writeFileSync(
  "./swagger.json",
  JSON.stringify(swaggerSpec, null, 2)
);