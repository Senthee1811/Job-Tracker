import { Job } from "../models/Job.js";
import { executeScrapeCycle } from "../services/schedulerService.js";
import { getScrapersHealth } from "../services/scrapers/index.js";
import { FALLBACK_SEED_JOBS } from "./recommendationController.js";

/**
 * GET /api/jobs
 * Returns paginated, filtered Sri Lankan IT vacancies from the Job collection.
 * Includes "isNewToday" badge indicator.
 */
export const getVacancies = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const { role, location, source, jobType, q } = req.query;

    try {
        const query = {};

        // Keyword / role search
        const searchTerm = role || q;
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
                { skills: { $in: [new RegExp(searchTerm, "i")] } },
                { company: { $regex: searchTerm, $options: "i" } }
            ];
        }

        // Location filter
        if (location && location !== "all") {
            query.location = { $regex: location, $options: "i" };
        }

        // Source filter
        if (source && source !== "all") {
            query.source = source.toLowerCase();
        }

        // Job type filter
        if (jobType && jobType !== "all") {
            query.jobType = { $regex: jobType, $options: "i" };
        }

        let total = await Job.countDocuments(query);
        if (total === 0 && !searchTerm && !location && !source && !jobType) {
            try {
                await Job.insertMany(FALLBACK_SEED_JOBS, { ordered: false });
                total = await Job.countDocuments(query);
            } catch (seedErr) {
                // Ignore duplicate errors
            }
        }

        const rawJobs = await Job.find(query)
            .sort({ postedAt: -1, scrapedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Calculate "New Today" cutoff (start of current day UTC)
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);

        const jobs = rawJobs.map((j) => {
            const jobDate = j.postedAt || j.scrapedAt || j.createdAt;
            const isNewToday = jobDate && new Date(jobDate) >= startOfToday;
            return {
                ...j,
                id: j._id.toString(),
                isNewToday: !!isNewToday
            };
        });

        return res.status(200).json({
            jobs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching vacancies:", error);
        return res.status(500).json({ message: "Failed to fetch vacancy listings" });
    }
};

/**
 * POST /api/jobs/refresh
 * Protected endpoint to manually trigger a scraper cycle across all registered boards.
 */
export const refreshVacancies = async (req, res) => {
    try {
        const result = await executeScrapeCycle();
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error triggering manual scrape refresh:", error);
        return res.status(500).json({ message: "Failed to execute manual scraper refresh" });
    }
};

/**
 * GET /api/jobs/sources/health
 * Returns health status and latest run metrics per scraper adapter.
 */
export const getSourcesHealth = async (req, res) => {
    try {
        const health = await getScrapersHealth();
        return res.status(200).json({ sources: health });
    } catch (error) {
        console.error("Error fetching scraper health:", error);
        return res.status(500).json({ message: "Failed to fetch scraper health metrics" });
    }
};

/**
 * Legacy GET /api/jobs/search for backward compatibility.
 */
export const getLiveJobs = async (req, res) => {
    req.query.role = req.query.query || req.query.role;
    return getVacancies(req, res);
};
