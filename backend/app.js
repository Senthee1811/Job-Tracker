import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { authRouter } from "./routes/authRouter.js";
import { userRouter } from "./routes/userRouter.js";
import { applicationRouter } from "./routes/applicationRouter.js";
import { jobsRouter } from "./routes/jobsRouter.js";
import { reminderRouter } from "./routes/reminderRouter.js";
import { cvRouter } from "./routes/cvRouter.js";
import { recommendationRouter } from "./routes/recommendationRouter.js";
import { cronRouter } from "./routes/cronRouter.js";

dotenv.config();

const app = express();

// Allowed origins for CORS (local dev, FRONTEND_URL env, and Vercel preview domains)
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000"
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, serverless cron)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/staging to prevent CORS breakage
    },
    credentials: true,
    exposedHeaders: ["Content-Disposition", "Content-Length", "Content-Type"]
}));

app.use(express.json());

// Serverless DB connection middleware: ensures DB connection is ready before request handling
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("[App] Database connection middleware error:", err.message);
        res.status(503).json({
            message: "Database connection failed. Please verify MongoDB service status.",
            error: process.env.NODE_ENV === "development" ? err.message : undefined
        });
    }
});

// Root & Health Check Endpoints
app.get("/", (req, res) => {
    res.send("Job Tracker API is Running");
});

app.get("/api/health", (req, res) => {
    const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
    const readyState = mongoose.connection.readyState;

    res.status(200).json({
        status: readyState === 1 ? "healthy" : "degraded",
        uptimeSeconds: Math.round(process.uptime()),
        database: {
            state: dbStates[readyState] || "unknown",
            host: mongoose.connection.host || "none"
        },
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/cv", cvRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/cron", cronRouter);

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
});

export default app;
