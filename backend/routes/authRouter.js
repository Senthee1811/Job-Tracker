import express from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, resetPassword } from "../controllers/authController.js";

// Rate limit: 5 password reset requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many password reset requests. Please try again in 15 minutes." }
});

export const authRouter = express.Router();

authRouter.post("/forgot-password", authLimiter, forgotPassword);
authRouter.post("/reset-password", authLimiter, resetPassword);
