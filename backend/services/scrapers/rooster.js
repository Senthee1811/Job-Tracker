/**
 * Adapter for Rooster.jobs (Sri Lanka Job Board)
 *
 * ROBOTS.TXT AUDIT:
 * - Fetched from: https://rooster.jobs/robots.txt
 * - Public job board listings accessible.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "rooster",
    baseUrl: "https://rooster.jobs",
    listUrls: [
        "https://rooster.jobs/jobs"
    ],
    selectors: {
        card: ".job-card, .card, div[class*='job-card'], div[class*='job_card']",
        title: ".job-title, h2, h3, a[class*='title'], div[class*='title']",
        company: ".company-name, .company, .employer",
        location: ".location, .job-location",
        link: "a[href*='/jobs/'], a[href*='/job/'], a"
    },
    itCategoryFilter: true,
    rateLimitMs: 2000,
    enabled: true
};

/**
 * Parses list page HTML into raw vacancy objects.
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
        let link = card.find(config.selectors.link).first().attr("href") || card.attr("href") || "";

        if (link && !link.startsWith("http")) {
            link = `${config.baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
        }

        if (title && company && isItJob(title, "", "Software")) {
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
                description: `${title} role at ${company} via Rooster.jobs portal.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes Rooster.jobs listings.
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
                allJobs.push(normalizeJob({ ...item, dedupeHash }));
            }
        } catch (error) {
            console.warn(`Rooster scrape notice (${error.message}). Returning empty gracefully.`);
        }
    }

    return allJobs;
};
