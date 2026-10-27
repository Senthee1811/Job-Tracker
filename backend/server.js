import app from "./app.js";
import { connectDB } from "./lib/db.js";
import { initScheduler } from "./services/schedulerService.js";

const port = process.env.PORT || 8000;

try {
    await connectDB();
    console.log("[Server] Database connection verified");

    // Only start node-cron background task in local development
    if (process.env.NODE_ENV !== "production") {
        initScheduler();
    } else {
        console.log("[Server] Production environment detected: node-cron disabled in favor of Vercel Cron.");
    }

    app.listen(port, () => {
        console.log(`[Server] Job Tracker backend running on port ${port}`);
    });
} catch (error) {
    console.error("[Server] Fatal startup error:", error);
    process.exit(1);
}
