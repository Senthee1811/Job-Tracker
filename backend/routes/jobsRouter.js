import express from "express";
import { getVacancies, refreshVacancies, getSourcesHealth, getLiveJobs } from "../controllers/jobsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const jobsRouter = express.Router();

jobsRouter.get("/", authMiddleware, getVacancies);
jobsRouter.get("/search", authMiddleware, getLiveJobs);
jobsRouter.post("/refresh", authMiddleware, refreshVacancies);
jobsRouter.get("/sources/health", authMiddleware, getSourcesHealth);
