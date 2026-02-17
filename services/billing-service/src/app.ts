import express from "express";
import { json } from "body-parser";
import { billingRouter } from "./routes/billing.routes";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "billing-service" }));

  app.use("/billing", billingRouter);

  app.use(errorHandler);

  return app;
};
