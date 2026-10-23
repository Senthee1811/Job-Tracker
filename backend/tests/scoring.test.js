import test from "node:test";
import assert from "node:assert";
import { normalizeSkill, normalizeSkillList } from "../services/scoringConfig.js";
import {
    calculateSkillScore,
    calculateExperienceScore,
    calculatePreferenceScore,
    computeHybridScore
} from "../services/scoringService.js";
import { cosineSimilarity } from "../services/vectorStore.js";
import { chunkText } from "../services/chunkingService.js";
import { validateTailoredCvHallucinations } from "../services/geminiService.js";

test("Skill normalization: maps variations to canonical names", () => {
    assert.strictEqual(normalizeSkill("ReactJS"), "react");
    assert.strictEqual(normalizeSkill("React.js"), "react");
    assert.strictEqual(normalizeSkill("NodeJS"), "node.js");
    assert.strictEqual(normalizeSkill("Node"), "node.js");
    assert.strictEqual(normalizeSkill("Postgres"), "postgresql");
    assert.strictEqual(normalizeSkill("TailwindCSS"), "tailwind css");
});

test("Skill overlap score: computes correct percentage against alias map", () => {
    const candidateSkills = ["React", "NodeJS", "Express.js", "MongoDB"];
    const requiredSkills = ["React.js", "Node.js", "Docker", "AWS"];

    // Matched: react, node.js (2 out of 4 required) = 50%
    const score = calculateSkillScore(candidateSkills, requiredSkills);
    assert.strictEqual(score, 50);
});

test("Experience fit score: matches experience level correctly", () => {
    // Candidate with 4 years applying to Senior role (requires 5) -> 80
    assert.strictEqual(calculateExperienceScore(4, "Senior Full Stack Engineer (5+ years experience)"), 80);
    // Candidate with 5 years applying to Senior role -> 100
    assert.strictEqual(calculateExperienceScore(5, "Senior Developer"), 100);
    // Junior applying to intern/junior role -> 100
    assert.strictEqual(calculateExperienceScore(1, "Associate / Junior Software Engineer"), 100);
});

test("Cosine similarity: computes 1 for identical and 0 for orthogonal vectors", () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    assert.strictEqual(Math.round(cosineSimilarity(vecA, vecB)), 1);
    assert.strictEqual(Math.round(cosineSimilarity(vecA, vecC)), 0);
});

test("Hybrid score: respects 50/30/10/10 weight distribution", () => {
    const result = computeHybridScore({
        candidateVector: [1, 1, 0],
        jobVector: [1, 1, 0], // 100% semantic -> 50 pts
        candidateSkills: ["React", "Node.js"],
        requiredSkills: ["React", "Node.js"], // 100% skills -> 30 pts
        candidateYears: 5,
        jobDescription: "Senior Developer", // 100% exp -> 10 pts
        userPreferences: { role: "Developer", location: "Colombo", mode: "hybrid" },
        job: { title: "Developer", location: "Colombo", mode: "hybrid" } // 100% pref -> 10 pts
    });

    assert.strictEqual(result.finalScore, 100);
});

test("Chunking service: produces overlapping chunks within char limits", () => {
    const paragraphs = [
        "Paragraph 1: Introduction to candidate background and engineering expertise.",
        "Paragraph 2: Deep experience building production web applications using modern stacks.",
        "Paragraph 3: Cloud architecture, continuous deployment pipelines, and observability."
    ].join("\n\n");

    const chunks = chunkText(paragraphs, { maxChars: 120, overlapChars: 20 });
    assert.ok(chunks.length >= 2, "Should create multiple chunks for multi-paragraph text");
    assert.ok(chunks[0].text.length <= 120);
});

test("Anti-hallucination check: catches skills or companies not in source profile", () => {
    const originalProfile = {
        skills: ["React", "Node.js", "TypeScript"],
        experience: [{ company: "Acme Corp", role: "Frontend Dev" }]
    };

    // Valid tailored output
    const validTailored = {
        highlightedSkills: ["React", "Node.js"],
        experience: [{ company: "Acme Corp", role: "Frontend Engineer" }]
    };
    const validResult = validateTailoredCvHallucinations(validTailored, originalProfile);
    assert.strictEqual(validResult.valid, true);

    // Invalid tailored output with hallucinated skills and company
    const invalidTailored = {
        highlightedSkills: ["React", "Rust", "Golang"], // Rust and Golang are hallucinated
        experience: [{ company: "Google", role: "Tech Lead" }] // Google is hallucinated
    };
    const invalidResult = validateTailoredCvHallucinations(invalidTailored, originalProfile);
    assert.strictEqual(invalidResult.valid, false);
    assert.ok(invalidResult.hallucinatedSkills.includes("rust"));
    assert.ok(invalidResult.hallucinatedCompanies.includes("google"));
});
