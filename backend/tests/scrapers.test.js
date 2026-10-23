import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";

import * as itpro from "../services/scrapers/itpro.js";
import * as topjobs from "../services/scrapers/topjobs.js";
import * as ikman from "../services/scrapers/ikman.js";
import * as rooster from "../services/scrapers/rooster.js";
import * as recruiter from "../services/scrapers/recruiter.js";
import { generateDedupeHash, isItJob } from "../services/scrapers/shared.js";

const FIXTURES_DIR = path.resolve(process.cwd(), "tests", "fixtures");

test("Dedupe Hash generation: produces stable deterministic sha256", () => {
    const hash1 = generateDedupeHash("itpro", "Senior React Developer", "Virtusa", "2026-10-31");
    const hash2 = generateDedupeHash("itpro", "Senior React Developer", "Virtusa", "2026-10-31");
    const hashDifferent = generateDedupeHash("itpro", "QA Engineer", "Virtusa", "2026-10-31");

    assert.strictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hashDifferent);
    assert.strictEqual(typeof hash1, "string");
    assert.strictEqual(hash1.length, 64);
});

test("IT Keyword Filter: identifies IT titles and filters non-IT roles", () => {
    assert.strictEqual(isItJob("Full Stack Software Engineer"), true);
    assert.strictEqual(isItJob("QA Automation Specialist"), true);
    assert.strictEqual(isItJob("DevOps / Cloud Architect"), true);
    assert.strictEqual(isItJob("React Native Developer Intern"), true);

    // Non-IT roles
    assert.strictEqual(isItJob("Junior Accounts Executive"), false);
    assert.strictEqual(isItJob("Delivery Van Driver"), false);
    assert.strictEqual(isItJob("Executive Housekeeper"), false);
});

test("ITPro adapter: parses real live HTML fixture accurately", () => {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, "itpro.html"), "utf-8");
    const jobs = itpro.parseListPage(html);

    assert.ok(jobs.length > 0, "Should find at least 1 job in ITPro fixture");
    const first = jobs[0];
    assert.ok(first.title.toLowerCase().includes("software engineer") || first.title.length > 3);
    assert.ok(first.company.length > 1);
    assert.ok(first.applyUrl.startsWith("http"));
    assert.strictEqual(first.source, "itpro");
});

test("TopJobs adapter: parses table rows and filters out non-IT rows", () => {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, "topjobs.html"), "utf-8");
    const jobs = topjobs.parseListPage(html);

    // Fixture has 2 IT jobs and 1 Accounts job
    assert.strictEqual(jobs.length, 2);
    assert.ok(jobs.some(j => j.title.includes("Full Stack Developer")));
    assert.ok(jobs.some(j => j.title.includes("QA Automation Engineer")));
    assert.strictEqual(jobs.some(j => j.title.includes("Accounts")), false);
});

test("ikman.lk adapter: parses __NEXT_DATA__ JSON and filters IT classifieds", () => {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, "ikman.html"), "utf-8");
    const jobs = ikman.parseListPage(html);

    // Fixture has 1 IT ad and 1 Driver ad
    assert.strictEqual(jobs.length, 1);
    assert.ok(jobs[0].title.includes("React Frontend Developer"));
    assert.strictEqual(jobs[0].company, "CodeWave Technologies");
    assert.ok(jobs[0].applyUrl.includes("ikman.lk"));
});

test("Rooster adapter: parses card elements and filters out non-IT jobs", () => {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, "rooster.html"), "utf-8");
    const jobs = rooster.parseListPage(html);

    // Fixture has 1 Cloud DevOps job and 1 Hotel Front Desk job
    assert.strictEqual(jobs.length, 1);
    assert.ok(jobs[0].title.includes("Cloud DevOps Engineer"));
    assert.strictEqual(jobs[0].company, "OctaSync Software");
});

test("Recruiter.lk adapter: parses article listings and drops non-IT jobs", () => {
    const html = fs.readFileSync(path.join(FIXTURES_DIR, "recruiter.html"), "utf-8");
    const jobs = recruiter.parseListPage(html);

    // Fixture has 1 MERN developer and 1 restaurant supervisor
    assert.strictEqual(jobs.length, 1);
    assert.ok(jobs[0].title.includes("MERN Developer"));
    assert.strictEqual(jobs[0].company, "Apex Global Digital");
});
