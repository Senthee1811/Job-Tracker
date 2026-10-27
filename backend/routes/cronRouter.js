import express from "express";
import { REGISTERED_SCRAPERS, runSingleScraper, runAllScrapers } from "../services/scrapers/index.js";

export const cronRouter = express.Router();

/**
 * GET /api/cron/scrape?source=<name>&secret=<secret>
 * Protected scraper cron trigger for Vercel Cron.
 * Supports source-specific execution to stay safely within serverless function timeouts.
 */
cronRouter.get("/scrape", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;
    const querySecret = req.query.secret;

    // Verify secret if configured in environment
    if (cronSecret) {
        const isBearerValid = authHeader && authHeader === `Bearer ${cronSecret}`;
        const isQueryValid = querySecret && querySecret === cronSecret;

        if (!isBearerValid && !isQueryValid) {
            return res.status(401).json({ message: "Unauthorized. Valid CRON_SECRET is required." });
        }
    }

    const requestedSource = (req.query.source || "").toLowerCase().trim();

    try {
        if (requestedSource && requestedSource !== "all") {
            const adapter = REGISTERED_SCRAPERS.find(
                a => (a.config?.name || "").toLowerCase() === requestedSource
            );

            if (!adapter) {
                const available = REGISTERED_SCRAPERS.map(a => a.config?.name).filter(Boolean);
                return res.status(400).json({
                    message: `Unknown scraper source: "${requestedSource}". Available sources: ${available.join(", ")}`
                });
            }

            console.log(`[Cron Route] Triggering single source scrape: ${requestedSource}`);
            const result = await runSingleScraper(adapter);
            return res.status(200).json({
                message: `Cron scrape completed for source: ${requestedSource}`,
                result
            });
        }

        console.log("[Cron Route] Triggering all registered scraper sources");
        const results = await runAllScrapers();
        return res.status(200).json({
            message: "All scrapers executed successfully",
            results
        });
    } catch (error) {
        console.error("[Cron Route] Scrape execution error:", error);
        return res.status(500).json({
            message: "Failed to execute cron scrape",
            error: error.message
        });
    }
});
