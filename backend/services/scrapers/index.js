import { Job } from "../../models/Job.js";
import { ScrapeRun } from "../../models/ScrapeRun.js";
import { generateDedupeHash } from "./shared.js";

// Import all adapters
import * as topjobs from "./topjobs.js";
import * as itpro from "./itpro.js";
import * as xpressjobs from "./xpressjobs.js";
import * as ikman from "./ikman.js";
import * as rooster from "./rooster.js";
import * as recruiter from "./recruiter.js";

// Registered scrapers registry in priority order
export const REGISTERED_SCRAPERS = [
    topjobs,
    itpro,
    xpressjobs,
    ikman,
    rooster,
    recruiter
];

/**
 * Checks whether a job with the specified dedupeHash already exists in the database.
 * Used to avoid fetching detail pages for existing jobs.
 *
 * @param {string} dedupeHash
 * @returns {Promise<boolean>} True if the job is new (does not exist in DB)
 */
export const isJobNewInDb = async (dedupeHash) => {
    try {
        const existing = await Job.findOne({ dedupeHash }).select("_id").lean();
        return !existing;
    } catch (err) {
        return true;
    }
};

/**
 * Runs a single scraper adapter safely, recording health metrics to ScrapeRun collection.
 *
 * @param {object} adapter - Scraper module
 * @returns {Promise<{ source: string, found: number, new: number, duplicates: number, errors: string[] }>}
 */
export const runSingleScraper = async (adapter) => {
    const sourceName = adapter.config?.name || "unknown";
    const startedAt = new Date();
    const startTime = Date.now();
    const errors = [];
    let foundCount = 0;
    let newCount = 0;
    let dupCount = 0;

    console.log(`[Scraper] Starting execution for source: ${sourceName}`);

    try {
        const scrapedJobs = await adapter.scrape(isJobNewInDb);
        foundCount = scrapedJobs.length;

        for (const jobData of scrapedJobs) {
            try {
                const dedupeHash = jobData.dedupeHash ||
                    generateDedupeHash(sourceName, jobData.title, jobData.company, jobData.closingDate);

                // Check for duplicate in DB
                const existing = await Job.findOne({ dedupeHash });
                if (existing) {
                    dupCount++;
                    continue;
                }

                // Insert new job
                const newJob = new Job({
                    ...jobData,
                    dedupeHash,
                    source: sourceName,
                    scrapedAt: new Date()
                });

                await newJob.save();
                newCount++;
            } catch (saveErr) {
                // Ignore duplicate key collision
                if (saveErr.code === 11000) {
                    dupCount++;
                } else {
                    errors.push(`Job save error (${jobData.title}): ${saveErr.message}`);
                }
            }
        }
    } catch (adapterErr) {
        console.error(`[Scraper] Adapter error for ${sourceName}:`, adapterErr.message);
        errors.push(adapterErr.message);
    }

    const durationMs = Date.now() - startTime;
    const status = errors.length === 0 ? "success" : (newCount > 0 ? "partial" : "failed");

    // Save ScrapeRun record
    try {
        const runDoc = new ScrapeRun({
            source: sourceName,
            startedAt,
            durationMs,
            found: foundCount,
            new: newCount,
            duplicates: dupCount,
            errors,
            status
        });
        await runDoc.save();
    } catch (metricErr) {
        console.warn(`[Scraper] Failed to save ScrapeRun metric for ${sourceName}:`, metricErr.message);
    }

    console.log(`[Scraper] Finished ${sourceName}: found=${foundCount}, new=${newCount}, dups=${dupCount}, duration=${durationMs}ms`);

    return {
        source: sourceName,
        found: foundCount,
        new: newCount,
        duplicates: dupCount,
        errors,
        durationMs,
        status
    };
};

/**
 * Runs all registered scraper adapters in parallel with Promise.allSettled for full isolation.
 *
 * @returns {Promise<Array<object>>} Summary of all scraper runs
 */
export const runAllScrapers = async () => {
    console.log(`[Scrapers] Executing ${REGISTERED_SCRAPERS.length} registered scraper adapters...`);

    const results = await Promise.allSettled(
        REGISTERED_SCRAPERS.map(adapter => runSingleScraper(adapter))
    );

    const summaries = results.map((res, index) => {
        if (res.status === "fulfilled") {
            return res.value;
        } else {
            const name = REGISTERED_SCRAPERS[index].config?.name || `source-${index}`;
            return {
                source: name,
                found: 0,
                new: 0,
                duplicates: 0,
                errors: [res.reason?.message || "Unknown scraper failure"],
                status: "failed"
            };
        }
    });

    return summaries;
};

/**
 * Retrieves the latest scrape health metrics for each registered source.
 *
 * @returns {Promise<Array<object>>} Latest ScrapeRun per source
 */
export const getScrapersHealth = async () => {
    const healthSummaries = [];

    for (const adapter of REGISTERED_SCRAPERS) {
        const sourceName = adapter.config?.name || "unknown";
        const latestRun = await ScrapeRun.findOne({ source: sourceName })
            .sort({ startedAt: -1 })
            .lean();

        healthSummaries.push({
            source: sourceName,
            enabled: adapter.config?.enabled ?? true,
            baseUrl: adapter.config?.baseUrl,
            latestRun: latestRun || null,
            status: latestRun ? latestRun.status : "never_run"
        });
    }

    return healthSummaries;
};
