import crypto from "crypto";

export const USER_AGENT = "JobTrackerBot/1.0 (+https://github.com/jobtracker; automated Sri Lankan IT vacancies indexer)";

/**
 * Shared IT keywords list used across all adapters.
 */
export const IT_KEYWORDS = [
    "software engineer", "software developer", "developer", "full stack", "fullstack",
    "frontend", "front-end", "backend", "back-end", "mern", "mean", "react", "node",
    "qa", "quality assurance", "sdet", "devops", "cloud", "aws", "azure", "gcp",
    "mobile", "ios", "android", "flutter", "react native", "data engineer", "data scientist",
    "ai/ml", "machine learning", "artificial intelligence", "ui/ux", "product designer",
    "intern", "internship", "trainee", "associate", "tech lead", "technical lead",
    "architect", "scrum master", "system engineer", "network engineer", "database administrator",
    "cyber security", "infosec", "golang", "python", "java", "php", "c#", ".net"
];

/**
 * Checks whether a job listing matches IT / Software vacancy criteria.
 *
 * @param {string} title
 * @param {string} [description=""]
 * @param {string} [category=""]
 * @returns {boolean}
 */
export const isItJob = (title = "", description = "", category = "") => {
    const combined = `${title} ${category} ${description}`.toLowerCase();
    return IT_KEYWORDS.some(kw => combined.includes(kw));
};

/**
 * Generates deterministic deduplication hash from source, title, company, and closing date.
 *
 * @param {string} source
 * @param {string} title
 * @param {string} company
 * @param {string|Date} [closingDate=""]
 * @returns {string} Hex SHA-256 hash
 */
export const generateDedupeHash = (source, title, company, closingDate = "") => {
    const normSource = (source || "").toLowerCase().trim();
    const normTitle = (title || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const normCompany = (company || "").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const normClosing = closingDate ? new Date(closingDate).toISOString().slice(0, 10) : "";

    const rawKey = `${normSource}:${normTitle}:${normCompany}:${normClosing}`;
    return crypto.createHash("sha256").update(rawKey).digest("hex");
};

// Host queues for concurrency and rate-limiting
const hostQueues = new Map();

/**
 * Polite fetcher honoring rate-limits, max 2 concurrent requests per host, 15s timeout, and exponential backoff.
 *
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.rateLimitMs=2000]
 * @param {number} [options.maxRetries=3]
 * @returns {Promise<Response>}
 */
export const politeFetch = async (url, options = {}) => {
    const { rateLimitMs = 2000, maxRetries = 3 } = options;
    const urlObj = new URL(url);
    const host = urlObj.host;

    if (!hostQueues.has(host)) {
        hostQueues.set(host, { activeCount: 0, lastRequestTime: 0, queue: [] });
    }
    const hostState = hostQueues.get(host);

    // Wait for concurrency slot (max 2) and rate-limit delay (1.5s - 3s)
    await new Promise((resolve) => {
        const tryRun = () => {
            const now = Date.now();
            const elapsed = now - hostState.lastRequestTime;
            const delayNeeded = Math.max(0, rateLimitMs - elapsed);

            if (hostState.activeCount < 2) {
                hostState.activeCount++;
                if (delayNeeded > 0) {
                    setTimeout(() => {
                        hostState.lastRequestTime = Date.now();
                        resolve();
                    }, delayNeeded);
                } else {
                    hostState.lastRequestTime = now;
                    resolve();
                }
            } else {
                hostState.queue.push(tryRun);
            }
        };
        tryRun();
    });

    try {
        let attempt = 0;
        let backoffMs = 1500;

        while (attempt <= maxRetries) {
            try {
                const response = await fetch(url, {
                    headers: {
                        "User-Agent": USER_AGENT,
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
                        ...(options.headers || {})
                    },
                    signal: AbortSignal.timeout(15000)
                });

                if (response.status === 429) {
                    const retryAfter = response.headers.get("retry-after");
                    const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : backoffMs;
                    console.warn(`Host ${host} responded 429 Rate Limited. Waiting ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    attempt++;
                    backoffMs *= 2;
                    continue;
                }

                return response;
            } catch (err) {
                attempt++;
                if (attempt > maxRetries) throw err;
                console.warn(`Request to ${url} failed (attempt ${attempt}): ${err.message}. Retrying in ${backoffMs}ms...`);
                await new Promise(r => setTimeout(r, backoffMs));
                backoffMs *= 2;
            }
        }
    } finally {
        hostState.activeCount--;
        if (hostState.queue.length > 0) {
            const next = hostState.queue.shift();
            next();
        }
    }
};

/**
 * Normalizes job object according to unified schema.
 * Fields not found return null (never guess).
 */
export const normalizeJob = (raw = {}) => {
    return {
        title: raw.title ? String(raw.title).trim() : null,
        company: raw.company ? String(raw.company).trim() : null,
        location: raw.location ? String(raw.location).trim() : null,
        description: raw.description ? String(raw.description).trim() : null,
        requirements: Array.isArray(raw.requirements) ? raw.requirements.filter(Boolean) : [],
        skills: Array.isArray(raw.skills) ? raw.skills.filter(Boolean) : [],
        salary: raw.salary ? String(raw.salary).trim() : null,
        jobType: raw.jobType ? String(raw.jobType).trim() : null,
        mode: ["remote", "on-site", "hybrid"].includes(raw.mode) ? raw.mode : "hybrid",
        postedAt: raw.postedAt ? new Date(raw.postedAt) : new Date(),
        closingDate: raw.closingDate ? new Date(raw.closingDate) : null,
        applyUrl: raw.applyUrl ? String(raw.applyUrl).trim() : null,
        source: raw.source ? String(raw.source).toLowerCase().trim() : null,
        sourceUrl: raw.sourceUrl ? String(raw.sourceUrl).trim() : null
    };
};
