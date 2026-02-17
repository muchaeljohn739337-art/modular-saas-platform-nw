import express from "express";
import { json } from "body-parser";
import { web3Router } from "./routes/web3.routes";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = () => {
  const app = express();

  app.use(json());
  app.use(requestLogger);

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "web3-service" }));

  app.use("/web3", web3Router);

  app.use(errorHandler);

  return app;
};
