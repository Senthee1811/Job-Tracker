import { User } from "../models/User.js";
import { CV } from "../models/CV.js";
import { Job } from "../models/Job.js";
import { rankJobsForCandidate, invalidateScoreCacheForCv } from "../services/scoringService.js";

/**
 * Fallback seed jobs for initial testing before scrapers run.
 */
const FALLBACK_SEED_JOBS = [
    {
        _id: "seed-job-1",
        title: "Full Stack Software Engineer (React / Node.js)",
        company: "Sysco LABS Sri Lanka",
        location: "Colombo, Sri Lanka",
        mode: "hybrid",
        salary: "LKR 350,000 - 500,000",
        skills: ["React", "Node.js", "TypeScript", "MongoDB", "REST API", "Docker", "AWS"],
        description: "Join our enterprise engineering team building scalable supply chain platforms with React, Node.js, and cloud native architectures.",
        requirements: ["3+ years experience with React and Node.js", "Strong grasp of RESTful microservices and TypeScript", "Familiarity with cloud and containerized workflows"],
        source: "seed",
        applyUrl: "https://syscolabs.lk/careers",
        postedAt: new Date()
    },
    {
        _id: "seed-job-2",
        title: "Frontend Developer (React / Next.js / Tailwind)",
        company: "WSO2",
        location: "Colombo, Sri Lanka",
        mode: "remote",
        salary: "Competitive",
        skills: ["React", "Next.js", "Tailwind CSS", "JavaScript", "HTML", "CSS", "Git"],
        description: "Design high performance user interfaces for open-source identity and API management software.",
        requirements: ["Strong experience with modern React 18/19 ecosystem", "Tailwind CSS and component libraries", "Eye for detail and UX accessibility"],
        source: "seed",
        applyUrl: "https://wso2.com/careers",
        postedAt: new Date()
    },
    {
        _id: "seed-job-3",
        title: "Backend Engineer (Node.js / Express / PostgreSQL)",
        company: "Virtusa",
        location: "Colombo, Sri Lanka",
        mode: "hybrid",
        salary: "Market Rate",
        skills: ["Node.js", "Express", "PostgreSQL", "SQL", "Docker", "Git"],
        description: "Develop robust financial and banking backend microservices handling high transaction throughput.",
        requirements: ["2+ years building APIs with Node.js and Express", "SQL database optimization and schema design", "Unit testing and CI/CD pipelines"],
        source: "seed",
        applyUrl: "https://www.virtusa.com/careers",
        postedAt: new Date()
    },
    {
        _id: "seed-job-4",
        title: "Associate DevOps / Cloud Engineer",
        company: "IFS Sri Lanka",
        location: "Colombo, Sri Lanka",
        mode: "on-site",
        salary: "Negotiable",
        skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Python"],
        description: "Support our enterprise ERP cloud infrastructure deployment and monitoring pipelines.",
        requirements: ["Knowledge of containerization with Docker", "Experience with AWS or Azure cloud environments", "Scripting with Bash or Python"],
        source: "seed",
        applyUrl: "https://www.ifs.com/careers",
        postedAt: new Date()
    }
];

/**
 * GET /api/recommendations
 * Returns ranked jobs with match scores, skill breakdown, and top-N AI explanations.
 */
export const getRecommendations = async (req, res) => {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const activeCv = await CV.findOne({ userId, isActive: true });

        // Fetch jobs from database (or fallback seeds if scraper has not populated yet)
        let jobs = await Job.find().sort({ postedAt: -1 }).limit(100).lean();
        if (jobs.length === 0) {
            jobs = FALLBACK_SEED_JOBS;
        }

        // Run hybrid scoring & ranking
        const rankedJobs = await rankJobsForCandidate(activeCv, user, jobs, 5);

        // Paginate results
        const startIndex = (page - 1) * limit;
        const paginated = rankedJobs.slice(startIndex, startIndex + limit);

        return res.status(200).json({
            recommendations: paginated,
            total: rankedJobs.length,
            page,
            totalPages: Math.ceil(rankedJobs.length / limit),
            hasActiveCv: !!activeCv
        });
    } catch (error) {
        console.error("Error generating recommendations:", error);
        return res.status(500).json({ message: "Failed to generate job recommendations" });
    }
};

/**
 * POST /api/recommendations/recompute
 * Clears score cache and forces recomputing match scores for user.
 */
export const recomputeRecommendations = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const activeCv = await CV.findOne({ userId, isActive: true });
        const cvId = activeCv?._id?.toString() || userId;

        // Invalidate score cache
        invalidateScoreCacheForCv(cvId);

        // Fetch and re-rank
        let jobs = await Job.find().sort({ postedAt: -1 }).limit(100).lean();
        if (jobs.length === 0) {
            jobs = FALLBACK_SEED_JOBS;
        }

        const rankedJobs = await rankJobsForCandidate(activeCv, user, jobs, 5);

        return res.status(200).json({
            message: "Recommendations recomputed successfully",
            recommendations: rankedJobs.slice(0, 10),
            total: rankedJobs.length
        });
    } catch (error) {
        console.error("Error recomputing recommendations:", error);
        return res.status(500).json({ message: "Failed to recompute recommendations" });
    }
};
