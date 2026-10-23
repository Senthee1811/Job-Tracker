import cron from "node-cron";
import { runAllScrapers } from "./scrapers/index.js";

let isRunning = false;

/**
 * Executes a full scraper refresh cycle and logs execution metrics.
 */
export const executeScrapeCycle = async () => {
    if (isRunning) {
        console.log("[Scheduler] A scrape run is already in progress. Skipping concurrent run.");
        return { message: "Scraper is already running" };
    }

    isRunning = true;
    console.log(`[Scheduler] Starting daily vacancy scraper run at ${new Date().toISOString()}`);

    try {
        const results = await runAllScrapers();
        const totalNew = results.reduce((sum, r) => sum + (r.new || 0), 0);
        const totalFound = results.reduce((sum, r) => sum + (r.found || 0), 0);
        const totalDups = results.reduce((sum, r) => sum + (r.duplicates || 0), 0);

        console.log(`[Scheduler] Vacancy scraping completed. Found: ${totalFound}, New: ${totalNew}, Duplicates: ${totalDups}`);
        return {
            message: "Scraping cycle completed successfully",
            summary: { totalFound, totalNew, totalDups },
            results
        };
    } catch (error) {
        console.error("[Scheduler] Scraper cycle error:", error);
        throw error;
    } finally {
        isRunning = false;
    }
};

/**
 * Initializes the daily cron job scheduled at 06:00 Asia/Colombo.
 */
export const initScheduler = () => {
    // Schedule: 06:00 every day in Asia/Colombo timezone
    cron.schedule(
        "0 6 * * *",
        async () => {
            console.log("[Cron] Triggering scheduled 06:00 Asia/Colombo vacancy scrape...");
            await executeScrapeCycle();
        },
        {
            scheduled: true,
            timezone: "Asia/Colombo"
        }
    );

    console.log("[Scheduler] Daily vacancy cron registered for 06:00 Asia/Colombo.");
};
