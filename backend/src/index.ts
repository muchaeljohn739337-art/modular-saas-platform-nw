import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "advancia-payledger-backend",
    database: "neon-postgresql",
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Advancia PayLedger API",
    version: "2.0.0",
    database: "Neon PostgreSQL",
    endpoints: {
      health: "/health",
      users: "/api/users",
      patients: "/api/patients",
      providers: "/api/providers",
      accounts: "/api/accounts",
      invoices: "/api/invoices",
      payments: "/api/payments",
    },
  });
});

// Database test endpoint (without Prisma)
app.get("/api/db-test", (req, res) => {
  res.json({
    message: "Database connection configured",
    database_url: process.env.DATABASE_URL ? "Set" : "Not set",
    redis_url: process.env.REDIS_URL ? "Set" : "Not set",
  });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  },
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Advancia PayLedger Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  console.log(`🗄️ Database: Neon PostgreSQL`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

export default app;
