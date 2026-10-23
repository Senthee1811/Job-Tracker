/**
 * Adapter for Recruiter.lk (Sri Lanka recruitment board)
 *
 * ROBOTS.TXT AUDIT:
 * - Complies with public job listing crawl rules.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "recruiter",
    baseUrl: "https://www.recruiter.lk",
    listUrls: [
        "https://www.recruiter.lk/jobs"
    ],
    selectors: {
        card: ".job-listing, .job_listing, article, div.job-card",
        title: "h3, h2, .job-title, a[class*='title']",
        company: ".company-name, .company, span[class*='company']",
        location: ".location, span[class*='location']",
        link: "a[href*='/job/'], a[href*='/jobs/'], a"
    },
    itCategoryFilter: true,
    rateLimitMs: 2500,
    enabled: true
};

/**
 * Parses Recruiter.lk list page HTML.
 */
export const parseListPage = (html) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const jobs = [];

    $(config.selectors.card).each((_, element) => {
        const card = $(element);
        const title = card.find(config.selectors.title).first().text().trim();
        const company = card.find(config.selectors.company).first().text().trim();
        const location = card.find(config.selectors.location).first().text().trim() || "Sri Lanka";
        let link = card.find(config.selectors.link).first().attr("href") || "";

        if (link && !link.startsWith("http")) {
            link = `${config.baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
        }

        if (title && isItJob(title, "", "Software")) {
            jobs.push({
                title,
                company: company || "Sri Lanka Tech Enterprise",
                location,
                applyUrl: link || config.listUrls[0],
                sourceUrl: link || config.listUrls[0],
                source: config.name,
                postedAt: new Date(),
                salary: "Negotiable",
                jobType: "Full Time",
                description: `${title} opportunity via Recruiter.lk.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes Recruiter.lk listings.
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
            console.warn(`Recruiter.lk scrape notice (${error.message}). Returning empty gracefully.`);
        }
    }

    return allJobs;
};
