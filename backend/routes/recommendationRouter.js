import express from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getRecommendations, recomputeRecommendations } from "../controllers/recommendationController.js";

// AI endpoints rate limiter (30 requests per 15 minutes per IP/User)
const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many AI recommendation requests. Please try again in a few minutes." }
});

export const recommendationRouter = express.Router();

recommendationRouter.get("/", authMiddleware, aiRateLimiter, getRecommendations);
recommendationRouter.post("/recompute", authMiddleware, aiRateLimiter, recomputeRecommendations);
