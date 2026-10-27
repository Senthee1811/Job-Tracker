import { SCORING_WEIGHTS, normalizeSkillList } from "./scoringConfig.js";
import { cosineSimilarity } from "./vectorStore.js";
import { explainMatch } from "./geminiService.js";

// In-memory score cache: key `${cvId}_${jobId}` -> { score, breakdown, explanation, computedAt }
const scoreCache = new Map();

/**
 * Calculates skill overlap score (0 - 100) using normalized alias dictionary.
 */
export const calculateSkillScore = (candidateSkills = [], requiredSkills = []) => {
    const candidateNorm = new Set(normalizeSkillList(candidateSkills));
    const requiredNorm = normalizeSkillList(requiredSkills);

    if (requiredNorm.length === 0) {
        return candidateNorm.size > 0 ? 75 : 50;
    }

    const matchedCount = requiredNorm.filter(skill => candidateNorm.has(skill)).length;
    const ratio = matchedCount / requiredNorm.length;
    return Math.min(100, Math.round(ratio * 100));
};

/**
 * Calculates experience fit score (0 - 100).
 */
export const calculateExperienceScore = (candidateYears = 0, jobDescription = "") => {
    const text = (jobDescription || "").toLowerCase();
    let requiredYears = 1;

    const match = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (match && match[1]) {
        requiredYears = parseInt(match[1], 10);
    } else if (text.includes("senior") || text.includes("lead")) {
        requiredYears = 5;
    } else if (text.includes("mid") || text.includes("intermediate")) {
        requiredYears = 3;
    } else if (text.includes("intern") || text.includes("trainee") || text.includes("junior") || text.includes("associate")) {
        requiredYears = 0;
    }

    if (candidateYears >= requiredYears) {
        return 100;
    }

    const diff = requiredYears - candidateYears;
    if (diff === 1) return 80;
    if (diff === 2) return 60;
    return Math.max(25, 100 - diff * 25);
};

/**
 * Calculates preference fit score (0 - 100) based on target roles, locations, work mode, and job types.
 */
export const calculatePreferenceScore = (userPreferences = {}, job = {}) => {
    let score = 0;

    // 1. Roles / Title alignment (40 pts)
    const preferredRoles = Array.isArray(userPreferences.roles) && userPreferences.roles.length > 0
        ? userPreferences.roles.map(r => r.toLowerCase())
        : [String(userPreferences.role || "").toLowerCase()].filter(Boolean);

    const jobTitle = (job.title || "").toLowerCase();
    const jobDesc = (job.description || "").toLowerCase();

    if (preferredRoles.length === 0) {
        score += 35; // neutral baseline
    } else {
        const matchesRole = preferredRoles.some(r =>
            jobTitle.includes(r) ||
            r.split(" ").some(w => w.length > 3 && jobTitle.includes(w)) ||
            jobDesc.includes(r)
        );
        score += matchesRole ? 40 : 20;
    }

    // 2. Work mode & Job type match (30 pts)
    const userMode = (userPreferences.mode || "any").toLowerCase();
    const jobMode = (job.mode || "hybrid").toLowerCase();
    const preferredJobTypes = Array.isArray(userPreferences.jobTypes)
        ? userPreferences.jobTypes.map(t => t.toLowerCase())
        : [];
    const jobType = (job.jobType || "").toLowerCase();

    let modeMatches = userMode === "any" || userMode === jobMode;
    let typeMatches = preferredJobTypes.length === 0 || preferredJobTypes.some(t => jobType.includes(t));

    if (modeMatches && typeMatches) {
        score += 30;
    } else if (modeMatches || typeMatches) {
        score += 20;
    } else {
        score += 15;
    }

    // 3. Location match (30 pts)
    const preferredLocations = Array.isArray(userPreferences.locations) && userPreferences.locations.length > 0
        ? userPreferences.locations.map(l => l.toLowerCase())
        : [String(userPreferences.location || "sri lanka").toLowerCase()].filter(Boolean);

    const jobLoc = (job.location || "").toLowerCase();
    const matchesLoc = preferredLocations.length === 0 ||
        preferredLocations.includes("all sri lanka") ||
        preferredLocations.some(l => jobLoc.includes(l) || l.includes(jobLoc) || jobLoc.includes("sri lanka") || (l === "remote" && jobMode === "remote"));

    score += matchesLoc ? 30 : 10;

    return Math.min(100, score);
};

/**
 * Computes hybrid match score (0 - 100) for a candidate against a job listing.
 *
 * @param {object} params
 * @param {number[]} [params.candidateVector] - Embedding vector of candidate CV
 * @param {number[]} [params.jobVector] - Embedding vector of job listing
 * @param {string[]} [params.candidateSkills] - Candidate skills
 * @param {string[]} [params.requiredSkills] - Job required skills
 * @param {number} [params.candidateYears] - Candidate years of experience
 * @param {string} [params.jobDescription] - Job description text
 * @param {object} [params.userPreferences] - Candidate preferences
 * @param {object} [params.job] - Raw job document
 * @returns {{ finalScore: number, breakdown: object }}
 */
export const computeHybridScore = (params) => {
    const {
        candidateVector,
        jobVector,
        candidateSkills = [],
        requiredSkills = [],
        candidateYears = 0,
        jobDescription = "",
        userPreferences = {},
        job = {}
    } = params;

    // 1. Semantic Similarity (50%)
    let semanticScore = 70; // baseline if vector is empty
    if (candidateVector && jobVector && candidateVector.length > 0) {
        const sim = cosineSimilarity(candidateVector, jobVector);
        semanticScore = Math.max(0, Math.min(100, Math.round(sim * 100)));
    }

    // 2. Skill Overlap (30%)
    const skillScore = calculateSkillScore(candidateSkills, requiredSkills.length > 0 ? requiredSkills : job.skills);

    // 3. Experience Fit (10%)
    const experienceScore = calculateExperienceScore(candidateYears, jobDescription || job.requirements || job.title);

    // 4. Preference Fit (10%)
    const preferenceScore = calculatePreferenceScore(userPreferences, job);

    // Weighted combination
    const finalScore = Math.round(
        SCORING_WEIGHTS.semanticSimilarity * semanticScore +
        SCORING_WEIGHTS.skillOverlap * skillScore +
        SCORING_WEIGHTS.experienceFit * experienceScore +
        SCORING_WEIGHTS.preferenceFit * preferenceScore
    );

    return {
        finalScore: Math.max(0, Math.min(100, finalScore)),
        breakdown: {
            semantic: semanticScore,
            skills: skillScore,
            experience: experienceScore,
            preference: preferenceScore
        }
    };
};

/**
 * Ranks a list of jobs against an active CV document and user profile.
 * Only calls Gemini explainMatch for the top N ranked jobs.
 *
 * @param {object} cv - Active CV document
 * @param {object} user - User document
 * @param {Array<object>} jobs - List of candidate jobs
 * @param {number} [topNExplain=5] - Number of top jobs to generate LLM explanations for
 * @returns {Promise<Array<object>>} Ranked jobs with match scores and explanations
 */
export const rankJobsForCandidate = async (cv, user, jobs = [], topNExplain = 5) => {
    if (!jobs || jobs.length === 0) return [];

    const candidateSkills = cv?.structuredProfile?.skills?.length > 0
        ? cv.structuredProfile.skills
        : (user?.skills || []);
    const candidateYears = cv?.structuredProfile?.yearsOfExperience || (user?.age ? Math.max(0, user.age - 21) : 2);
    const cvId = cv?._id?.toString() || user?._id?.toString() || "default";

    // 1. Score every job using deterministic weights + vectors
    const scoredList = jobs.map((job) => {
        const jobId = job._id?.toString() || job.id || `${job.source}-${job.title}`;
        const cacheKey = `${cvId}_${jobId}`;

        if (scoreCache.has(cacheKey)) {
            const cached = scoreCache.get(cacheKey);
            return {
                ...job,
                matchScore: cached.score,
                scoreBreakdown: cached.breakdown,
                explanation: cached.explanation
            };
        }

        const scoreResult = computeHybridScore({
            candidateSkills,
            requiredSkills: job.skills || [],
            candidateYears,
            jobDescription: `${job.title} ${job.description || ""} ${job.requirements || ""}`,
            userPreferences: user?.preferences || {
                roles: user?.preferredRole ? [user.preferredRole] : [candidateSkills[0] || "Software Engineer"],
                locations: ["Colombo", "Remote"],
                jobTypes: ["Full Time"]
            },
            job
        });

        return {
            ...job,
            matchScore: scoreResult.finalScore,
            scoreBreakdown: scoreResult.breakdown,
            explanation: null // generate below for top N
        };
    });

    // 2. Sort descending by match score
    scoredList.sort((a, b) => b.matchScore - a.matchScore);

    // 3. Generate detailed explanation only for top N jobs
    const topJobs = scoredList.slice(0, topNExplain);
    for (const job of topJobs) {
        const jobId = job._id?.toString() || job.id || `${job.source}-${job.title}`;
        const cacheKey = `${cvId}_${jobId}`;

        if (!job.explanation) {
            job.explanation = await explainMatch(
                {
                    skills: candidateSkills,
                    yearsOfExperience: candidateYears,
                    roles: cv?.structuredProfile?.roles || ["Software Developer"]
                },
                job
            );

            // Cache the result
            scoreCache.set(cacheKey, {
                score: job.matchScore,
                breakdown: job.scoreBreakdown,
                explanation: job.explanation,
                computedAt: new Date()
            });
        }
    }

    return scoredList;
};

/**
 * Clears score cache for a candidate when their CV is re-uploaded.
 */
export const invalidateScoreCacheForCv = (cvId) => {
    for (const key of scoreCache.keys()) {
        if (key.startsWith(`${cvId}_`)) {
            scoreCache.delete(key);
        }
    }
};
