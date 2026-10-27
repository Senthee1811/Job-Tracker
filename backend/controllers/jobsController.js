import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import { executeScrapeCycle } from "../services/schedulerService.js";
import { getScrapersHealth } from "../services/scrapers/index.js";
import { FALLBACK_SEED_JOBS } from "./recommendationController.js";

/**
 * GET /api/jobs
 * Returns paginated, filtered Sri Lankan IT vacancies from the Job collection.
 * Defaults to the authenticated user's saved preferences when no explicit filter is passed.
 * Includes "isNewToday" badge indicator.
 */
export const getVacancies = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const { role, location, source, jobType, q, showAll } = req.query;

    try {
        // Ensure initial seeds exist if Job collection is completely empty
        const totalInDb = await Job.countDocuments();
        if (totalInDb === 0) {
            try {
                await Job.insertMany(FALLBACK_SEED_JOBS, { ordered: false });
            } catch (seedErr) {
                // Ignore duplicate errors
            }
        }

        const query = {};
        let appliedPreferences = null;

        const hasExplicitSearch = !!(role || q);
        const hasExplicitLocation = location && location !== "all";
        const hasExplicitSource = source && source !== "all";
        const hasExplicitJobType = jobType && jobType !== "all";
        const isShowAllRequested = showAll === "true" || showAll === true;

        // Apply explicit keyword / role search if provided
        const searchTerm = role || q;
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
                { skills: { $in: [new RegExp(searchTerm, "i")] } },
                { company: { $regex: searchTerm, $options: "i" } }
            ];
        }

        // Apply explicit location filter if provided
        if (hasExplicitLocation) {
            query.location = { $regex: location, $options: "i" };
        }

        // Apply explicit source filter if provided
        if (hasExplicitSource) {
            query.source = source.toLowerCase();
        }

        // Apply explicit job type filter if provided
        if (hasExplicitJobType) {
            query.jobType = { $regex: jobType, $options: "i" };
        }

        // If no explicit filter is passed and showAll is NOT requested, apply saved user preferences
        if (!hasExplicitSearch && !hasExplicitLocation && !hasExplicitSource && !hasExplicitJobType && !isShowAllRequested && req.user?.userId) {
            const user = await User.findById(req.user.userId).select("preferences").lean();
            if (user?.preferences?.roles?.length > 0) {
                appliedPreferences = user.preferences;

                const roleRegexes = user.preferences.roles.map(r => new RegExp(r, "i"));
                const roleConditions = [
                    { title: { $in: roleRegexes } },
                    { description: { $in: roleRegexes } },
                    { skills: { $in: roleRegexes } }
                ];

                const userLocations = user.preferences.locations || [];
                const hasSpecificLocations = userLocations.length > 0 && !userLocations.some(l => l.toLowerCase().includes("all"));

                if (hasSpecificLocations) {
                    const locRegexes = userLocations.map(l => new RegExp(l, "i"));
                    query.$and = [
                        { $or: roleConditions },
                        { $or: [{ location: { $in: locRegexes } }, { mode: "remote" }] }
                    ];
                } else {
                    query.$or = roleConditions;
                }
            }
        }

        let total = await Job.countDocuments(query);
        // Fallback: if preference filter yields 0 vacancies, gracefully broaden to all
        if (total === 0 && appliedPreferences) {
            total = await Job.countDocuments({});
            appliedPreferences = { ...appliedPreferences, broadened: true };
            const rawJobs = await Job.find({})
                .sort({ postedAt: -1, scrapedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean();

            const startOfToday = new Date();
            startOfToday.setUTCHours(0, 0, 0, 0);
            const jobs = rawJobs.map((j) => ({
                ...j,
                id: j._id.toString(),
                isNewToday: !!(j.postedAt && new Date(j.postedAt) >= startOfToday)
            }));

            return res.status(200).json({
                jobs,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                appliedPreferences
            });
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
            totalPages: Math.ceil(total / limit),
            appliedPreferences
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
