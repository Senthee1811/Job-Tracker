/**
 * Adapter for TopJobs.lk (Software / QA / Database / Network category)
 *
 * ROBOTS.TXT AUDIT:
 * - TopJobs.lk server-side rates and timeouts.
 * - Public category vacancy listings at /applicant/vacancybycategory.jsp?FA=SDQ are accessible.
 */

import * as cheerio from "cheerio";
import { politeFetch, normalizeJob, generateDedupeHash, isItJob } from "./shared.js";

export const config = {
    name: "topjobs",
    baseUrl: "https://www.topjobs.lk",
    listUrls: [
        "https://www.topjobs.lk/applicant/vacancybycategory.jsp?FA=SDQ"
    ],
    selectors: {
        row: "tr[id*='tr_'], tr[class*='row'], table tr",
        titleLink: "a[href*='advertisment.jsp'], a[href*='vacancybycategory.jsp'], h2 a",
        company: "td:nth-child(3), td.company, .company",
        closingDate: "td:nth-child(5), td.closing"
    },
    itCategoryFilter: false, // Category FA=SDQ is already IT / Software
    rateLimitMs: 2500,
    enabled: true
};

/**
 * Parses TopJobs category table HTML into raw vacancy objects.
 *
 * @param {string} html
 * @returns {Array<object>}
 */
export const parseListPage = (html) => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const jobs = [];

    // Parse table rows
    $("tr").each((_, row) => {
        const tr = $(row);
        const linkEl = tr.find("a[href*='advertisment.jsp'], a[href*='js_apply']").first();
        if (!linkEl.length) return;

        const title = linkEl.text().trim();
        if (!title || title.length < 3) return;

        // Company is usually in third cell
        let company = tr.find("td").eq(2).text().trim();
        if (!company || company.length < 2) {
            company = tr.find("td").eq(1).text().trim();
        }

        let link = linkEl.attr("href") || "";
        if (link && !link.startsWith("http")) {
            link = `${config.baseUrl}${link.startsWith("/") ? "" : "/"}${link}`;
        }

        const closingText = tr.find("td").eq(4).text().trim();
        let closingDate = null;
        if (closingText) {
            const parsed = new Date(closingText);
            if (!isNaN(parsed.getTime())) closingDate = parsed;
        }

        if (title && isItJob(title, "", "Software")) {
            jobs.push({
                title,
                company: company || "Sri Lankan Tech Employer",
                location: "Colombo / Sri Lanka",
                applyUrl: link || config.listUrls[0],
                sourceUrl: link || config.listUrls[0],
                source: config.name,
                postedAt: new Date(),
                closingDate,
                salary: "Negotiable",
                jobType: "Full Time",
                description: `${title} vacancy in Sri Lanka listed on TopJobs.lk.`,
                requirements: [],
                skills: []
            });
        }
    });

    return jobs;
};

/**
 * Scrapes TopJobs vacancies.
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
            console.warn(`TopJobs scrape notice (${error.message}). Returning empty gracefully.`);
            // TopJobs isolation: log and don't block other scrapers
        }
    }

    return allJobs;
};
