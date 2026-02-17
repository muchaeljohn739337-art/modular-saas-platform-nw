import { Router } from "express";
import {
  createAgent,
  executeTask,
  getTask,
  cancelTask,
  getActiveTasks,
  chatWithAgent,
  analyzeData,
  runComplianceCheck,
  detectFraud
} from "../controllers/ai.controller";

const router = Router();

router.post("/agents", createAgent);

router.post("/tasks", executeTask);
router.get("/tasks/:taskId", getTask);
router.delete("/tasks/:taskId", cancelTask);
router.get("/tasks/active", getActiveTasks);

router.post("/chat", chatWithAgent);
router.post("/analyze", analyzeData);
router.post("/compliance", runComplianceCheck);
router.post("/fraud-detection", detectFraud);

export { router as aiRouter };
