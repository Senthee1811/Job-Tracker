/**
 * Adapter for ITPro.lk (Sri Lanka IT-only job portal)
 *
 * ROBOTS.TXT AUDIT:
 * - Fetched from: https://itpro.lk/robots.txt
 * - Disallowed paths: /_lib/, /_tpl/, /admin/, /config/, /uploads/private/
 * - Result: Public vacancy listings at https://itpro.lk/jobs are explicitly ALLOWED.
 * - Terms of Service: Complies with rate limits and polite crawling standards.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "itpro",
    baseUrl: "https://itpro.lk",
    listUrls: ["https://itpro.lk/jobs"],
    selectors: {
        card: "article.job-card",
        title: ".jc-title, h2, h3",
        company: ".jc-company, .company",
        location: ".la, .location",
        link: "a.jcl, a[href*='/job/']",
        timePosted: "time.time-posted"
    },
    itCategoryFilter: false, // Site is 100% IT vacancies
    rateLimitMs: 2000,
    enabled: true
};

/**
 * Parses a list page HTML and returns raw vacancy objects.
 * Exported separately so it can be unit-tested against test fixtures.
 *
 * @param {string} html
 * @returns {Array<object>}
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

        const timePosted = card.find(config.selectors.timePosted).first().attr("datetime") ||
            card.find(config.selectors.timePosted).first().text().trim();

        if (title && company) {
            jobs.push({
                title,
                company,
                location,
                applyUrl: link,
                sourceUrl: link,
                source: config.name,
                postedAt: timePosted ? new Date(timePosted) : new Date(),
                salary: "Negotiable",
                jobType: "Full Time",
                description: `${title} vacancy at ${company}. Full details and application via ITPro.lk.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes detail page to extract full description and requirements.
 */
export const scrapeDetailPage = async (url) => {
    try {
        const res = await politeFetch(url, { rateLimitMs: config.rateLimitMs });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        const desc = $(".job-details, .job-description, .entry-content, article").first().text().trim();
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
        console.warn(`ITPro detail page scrape error for ${url}:`, err.message);
        return null;
    }
};

/**
 * Scrapes ITPro.lk vacancies.
 *
 * @param {function} [isJobNewCheck] - Optional callback (dedupeHash) => Promise<boolean>
 * @returns {Promise<Array<object>>} Normalized job objects
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
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} from ${url}`);
            }
            const html = await res.text();
            const rawList = parseListPage(html);

            for (const item of rawList) {
                const dedupeHash = generateDedupeHash(config.name, item.title, item.company, item.closingDate);
                let fullItem = { ...item, dedupeHash };

                // Fetch detail page only if job is new
                let isNew = true;
                if (typeof isJobNewCheck === "function") {
                    isNew = await isJobNewCheck(dedupeHash);
                }

                if (isNew && item.applyUrl) {
                    const detail = await scrapeDetailPage(item.applyUrl);
                    if (detail) {
                        if (detail.description) fullItem.description = detail.description;
                        if (detail.requirements?.length > 0) fullItem.requirements = detail.requirements;
                    }
                }

                allJobs.push(normalizeJob(fullItem));
            }
        } catch (error) {
            console.error(`Error scraping ITPro at ${url}:`, error.message);
            throw error;
        }
    }

    return allJobs;
};
