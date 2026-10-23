/**
 * Adapter for ikman.lk Jobs (Information Technology / Software category)
 *
 * ROBOTS.TXT AUDIT:
 * - Fetched from: https://ikman.lk/robots.txt
 * - Result: Public classified ads are indexable.
 * - Architecture: Next.js with embedded __NEXT_DATA__ JSON script.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "ikman",
    baseUrl: "https://ikman.lk",
    listUrls: [
        "https://ikman.lk/en/ads/sri-lanka/jobs"
    ],
    selectors: {
        card: "li[class*='item-'], div[class*='card-'], li.normal--2QYVk",
        title: "h2, h3, [class*='title-']",
        company: "[class*='company-'], [class*='poster-']",
        location: "[class*='location-'], [class*='description-']",
        link: "a[href*='/en/ad/']"
    },
    itCategoryFilter: true,
    rateLimitMs: 2500,
    enabled: true
};

/**
 * Extracts job items from embedded __NEXT_DATA__ JSON or HTML fallback.
 *
 * @param {string} html
 * @returns {Array<object>}
 */
export const parseListPage = (html) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const jobs = [];

    // 1. Try __NEXT_DATA__ JSON extraction first
    const nextDataScript = $("#__NEXT_DATA__").html();
    if (nextDataScript) {
        try {
            const parsed = JSON.parse(nextDataScript);
            const ads = parsed?.props?.pageProps?.initialData?.ads ||
                parsed?.props?.pageProps?.ads ||
                [];

            for (const ad of ads) {
                const title = ad.title || "";
                const description = ad.description || "";
                const category = ad.category?.name || "";

                if (isItJob(title, description, category)) {
                    const slug = ad.slug || `${ad.id}`;
                    const link = `${config.baseUrl}/en/ad/${slug}`;

                    jobs.push({
                        title,
                        company: ad.contactName || "Direct Tech Employer",
                        location: ad.location?.name || "Sri Lanka",
                        applyUrl: link,
                        sourceUrl: link,
                        source: config.name,
                        postedAt: ad.adDate ? new Date(ad.adDate) : new Date(),
                        salary: ad.price || "Negotiable",
                        jobType: "Full Time",
                        description: description || `${title} on ikman.lk`,
                        requirements: [],
                        skills: []
                    });
                }
            }

            if (jobs.length > 0) {
                return jobs;
            }
        } catch (jsonErr) {
            console.warn("Could not parse ikman __NEXT_DATA__:", jsonErr.message);
        }
    }

    // 2. HTML Fallback
    $(config.selectors.card).each((_, el) => {
        const card = $(el);
        const title = card.find(config.selectors.title).first().text().trim();
        const location = card.find(config.selectors.location).first().text().trim() || "Sri Lanka";
        let link = card.find(config.selectors.link).first().attr("href") || "";

        if (link && !link.startsWith("http")) {
            link = `${config.baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
        }

        if (title && isItJob(title)) {
            jobs.push({
                title,
                company: "Tech Employer (ikman)",
                location,
                applyUrl: link || config.listUrls[0],
                sourceUrl: link || config.listUrls[0],
                source: config.name,
                postedAt: new Date(),
                salary: "Negotiable",
                jobType: "Full Time",
                description: `${title} - Verified via ikman jobs portal.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes ikman.lk IT listings.
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
            console.warn(`ikman scrape notice (${error.message}). Returning empty gracefully.`);
        }
    }

    return allJobs;
};
