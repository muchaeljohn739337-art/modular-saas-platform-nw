import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Advancia PayLedger API",
      version: "2.0.0",
      description: "Healthcare payment processing API documentation",
      contact: {
        name: "Advancia Support",
        email: "support@advanciapayledger.com",
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Advancia PayLedger API Documentation",
  }));
};
