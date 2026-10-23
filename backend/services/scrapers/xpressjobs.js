/**
 * Adapter for XpressJobs (Sri Lanka Job Portal)
 *
 * ROBOTS.TXT AUDIT:
 * - Fetched from: https://xpress.jobs/robots.txt
 * - User-agent: *
 * - Disallow: (empty)
 * - Result: Scraping vacancy listings is ALLOWED.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "xpressjobs",
    baseUrl: "https://xpress.jobs",
    listUrls: [
        "https://xpress.jobs/jobs?q=Software",
        "https://xpress.jobs/jobs?q=Developer"
    ],
    selectors: {
        card: ".job-card, .job-list-card, div[class*='job-card'], div[class*='job_card'], div[class*='job_list']",
        title: ".job-title, h2, h3, a[class*='title']",
        company: ".company-name, .company, div[class*='company']",
        location: ".location, .job-location, div[class*='location']",
        link: "a[href*='/jobs/'], a[href*='/job/'], a"
    },
    itCategoryFilter: true,
    rateLimitMs: 2000,
    enabled: true
};

/**
 * Parses list page HTML and returns raw vacancy objects.
 *
 * @param {string} html
 * @returns {Array<object>}
 */
export const parseListPage = (html) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const jobs = [];

    $(config.selectors.card).each((i, element) => {
        const card = $(element);
        const title = card.find(config.selectors.title).first().text().trim();
        const company = card.find(config.selectors.company).first().text().trim();
        const location = card.find(config.selectors.location).first().text().trim() || "Sri Lanka";
        let link = card.find(config.selectors.link).first().attr("href") || "";

        if (link && !link.startsWith("http")) {
            link = `${config.baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
        }

        if (title && company) {
            // Drop non-IT vacancies
            if (!isItJob(title, "", "Software")) return;

            jobs.push({
                title,
                company,
                location,
                applyUrl: link || `${config.baseUrl}/jobs`,
                sourceUrl: link || `${config.baseUrl}/jobs`,
                source: config.name,
                postedAt: new Date(),
                salary: "Negotiable",
                jobType: "Full Time",
                description: `${title} role at ${company}. Apply directly on XpressJobs.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes detail page if job is new.
 */
export const scrapeDetailPage = async (url) => {
    try {
        if (!url || !url.startsWith("http")) return null;
        const res = await politeFetch(url, { rateLimitMs: config.rateLimitMs });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        const desc = $(".job-description, .vacancy-desc, .description, article").first().text().trim();
        const requirements = [];
        $("ul li").each((_, li) => {
            const text = $(li).text().trim();
            if (text.length > 10 && text.length < 250) {
                requirements.push(text);
            }
        });

        return {
            description: desc || null,
            requirements: requirements.slice(0, 10)
        };
    } catch (err) {
        return null;
    }
};

/**
 * Executes scraping across list URLs.
 */
export const scrape = async (isJobNewCheck = null) => {
    if (!config.enabled) {
        console.log(`Scraper [${config.name}] is disabled.`);
        return [];
    }

    const allJobs = [];

    for (const url of config.listUrls) {
        try {
            const res = await politeFetch(url, { rateLimitMs: config.rateLimitMs });
            if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

            const html = await res.text();
            const rawList = parseListPage(html);

            for (const item of rawList) {
                const dedupeHash = generateDedupeHash(config.name, item.title, item.company, item.closingDate);
                let fullItem = { ...item, dedupeHash };

                let isNew = true;
                if (typeof isJobNewCheck === "function") {
                    isNew = await isJobNewCheck(dedupeHash);
                }

                if (isNew && item.applyUrl && item.applyUrl.includes("/jobs/")) {
                    const detail = await scrapeDetailPage(item.applyUrl);
                    if (detail) {
                        if (detail.description) fullItem.description = detail.description;
                        if (detail.requirements?.length > 0) fullItem.requirements = detail.requirements;
                    }
                }

                allJobs.push(normalizeJob(fullItem));
            }
        } catch (error) {
            console.error(`Error scraping XpressJobs at ${url}:`, error.message);
            throw error;
        }
    }

    return allJobs;
};
