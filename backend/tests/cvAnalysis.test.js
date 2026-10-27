import test from "node:test";
import assert from "node:assert";
import { fallbackAnalyzeCv } from "../services/geminiService.js";
import { generateCvAnalysisPdfBuffer } from "../services/pdfService.js";

test("CV Analysis Heuristic Engine: computes valid structured scores and suggestions", () => {
    const sampleCvText = `
John Doe
Software Engineer | Colombo, Sri Lanka
Email: john.doe@example.com | LinkedIn: linkedin.com/in/johndoe

Summary:
Full-stack software engineer with 3+ years of experience building modern web applications.

Experience:
Senior Frontend Developer - Tech Corp (2022 - Present)
- Engineered scalable React interfaces, reducing page latency by 35%.
- Implemented CI/CD pipelines, scaling deployment frequency by 2x for 50,000 active users.

Education:
BSc in Computer Science - University of Colombo (2021)

Skills:
React, Node.js, JavaScript, TypeScript, MongoDB, Express, Git
    `;

    const mockProfile = {
        skills: ["React", "Node.js", "JavaScript", "TypeScript", "MongoDB", "Express", "Git"],
        yearsOfExperience: 3,
        roles: ["Software Engineer", "Frontend Developer"]
    };

    const report = fallbackAnalyzeCv(sampleCvText, mockProfile);

    // Validate scores are bounded between 0 and 100
    assert.ok(report.overallScore >= 0 && report.overallScore <= 100, "overallScore must be between 0 and 100");
    assert.ok(report.atsScore >= 0 && report.atsScore <= 100, "atsScore must be between 0 and 100");
    assert.ok(report.impactScore >= 0 && report.impactScore <= 100, "impactScore must be between 0 and 100");
    assert.ok(report.brevityScore >= 0 && report.brevityScore <= 100, "brevityScore must be between 0 and 100");
    assert.ok(report.skillsScore >= 0 && report.skillsScore <= 100, "skillsScore must be between 0 and 100");

    // Validate text summary
    assert.ok(typeof report.summary === "string" && report.summary.length > 20);

    // Validate arrays
    assert.ok(Array.isArray(report.strengths) && report.strengths.length > 0);
    assert.ok(Array.isArray(report.weaknesses));
    assert.ok(Array.isArray(report.missingKeywords));
    assert.ok(Array.isArray(report.actionableSuggestions) && report.actionableSuggestions.length > 0);
    assert.ok(Array.isArray(report.tailoredRoles) && report.tailoredRoles.length > 0);

    // Check suggestion schema
    const firstSug = report.actionableSuggestions[0];
    assert.ok(firstSug.section, "Suggestion must have a section name");
    assert.ok(firstSug.recommendation, "Suggestion must have a recommendation");
});

test("PDF Service: generates valid branded AI CV analysis report PDF buffer", async () => {
    const candidate = {
        firstname: "John",
        lastname: "Doe",
        email: "john.doe@example.com"
    };

    const cv = {
        originalName: "John_Doe_CV.pdf",
        version: 1
    };

    const report = {
        overallScore: 82,
        atsScore: 85,
        impactScore: 78,
        brevityScore: 90,
        skillsScore: 80,
        summary: "Strong candidate with demonstrable React and full stack experience.",
        strengths: ["Strong quantifiable metrics in React development", "Clean section hierarchy"],
        weaknesses: ["Add more cloud deployment keywords (AWS, Docker)"],
        missingKeywords: ["Docker", "Kubernetes", "AWS", "PostgreSQL"],
        actionableSuggestions: [
            {
                section: "Technical Skills",
                issue: "Missing containerization tools",
                recommendation: "Add Docker or Kubernetes if experienced."
            }
        ],
        tailoredRoles: ["Frontend Engineer", "Full Stack Developer"]
    };

    const buffer = await generateCvAnalysisPdfBuffer(candidate, cv, report);

    assert.ok(Buffer.isBuffer(buffer), "Expected PDF output to be a Buffer");
    assert.ok(buffer.length > 1000, "PDF buffer should contain meaningful content");

    // Check standard PDF file header
    const header = buffer.subarray(0, 5).toString("utf-8");
    assert.strictEqual(header, "%PDF-", "PDF buffer must start with %PDF- signature");
});
