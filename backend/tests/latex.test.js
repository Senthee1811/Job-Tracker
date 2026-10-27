import test from "node:test";
import assert from "node:assert";
import { escapeLatex, renderLatexResume } from "../lib/latexUtils.js";

test("LaTeX Escaper: escapes all special LaTeX characters properly", () => {
    const raw = "R&D at Acme Corp #1: 100% of $50k _budget_ {confidential} ~home ^top \\slash";
    const escaped = escapeLatex(raw);

    assert.ok(escaped.includes("\\&"), "Must escape &");
    assert.ok(escaped.includes("\\%"), "Must escape %");
    assert.ok(escaped.includes("\\$"), "Must escape $");
    assert.ok(escaped.includes("\\#"), "Must escape #");
    assert.ok(escaped.includes("\\_"), "Must escape _");
    assert.ok(escaped.includes("\\{") && escaped.includes("\\}"), "Must escape { and }");
    assert.ok(escaped.includes("\\textasciitilde{}"), "Must escape ~");
    assert.ok(escaped.includes("\\textasciicircum{}"), "Must escape ^");
    assert.ok(escaped.includes("\\textbackslash{}"), "Must escape \\");
});

test("LaTeX Escaper: strips non-printable ASCII control characters", () => {
    const dangerousInput = "Clean text\x00\x08\x0B\x0C\x0E\x1F\x7Fwith control chars";
    const sanitized = escapeLatex(dangerousInput);

    assert.strictEqual(sanitized, "Clean textwith control chars");
});

test("LaTeX Escaper: handles null, undefined, and non-string inputs safely", () => {
    assert.strictEqual(escapeLatex(null), "");
    assert.strictEqual(escapeLatex(undefined), "");
    assert.strictEqual(escapeLatex(12345), "12345");
});

test("LaTeX Resume Renderer: compiles structured JSON into Jake's Resume LaTeX template", () => {
    const candidate = {
        firstname: "Jane",
        lastname: "Perera",
        email: "jane.p@example.com",
        linkedin: "linkedin.com/in/jane-perera",
        location: "Colombo, Sri Lanka"
    };

    const tailored = {
        summary: "Software Engineer specializing in C# and Node.js with 100% commitment to high availability & scalability.",
        highlightedSkills: ["React", "C#", "Node.js", "MongoDB", "R&D"],
        experience: [
            {
                company: "Virtusa & WSO2",
                role: "Senior Full Stack Developer",
                duration: "2023 - Present",
                location: "Colombo",
                bullets: [
                    "Engineered real-time analytics reducing latency by 45% for 100k+ daily users.",
                    "Optimized microservice REST APIs with 99.9% uptime."
                ]
            }
        ],
        projects: [
            {
                title: "Job Tracker ATS",
                technologies: ["React", "Express", "LaTeX"],
                description: "Built automated tailoring engine generating LaTeX and PDF resumes."
            }
        ],
        education: [
            {
                institution: "University of Moratuwa",
                degree: "BSc (Hons) in Engineering",
                year: "2022"
            }
        ]
    };

    const tex = renderLatexResume(candidate, tailored);

    assert.ok(tex.includes("\\documentclass"), "Must have standard LaTeX documentclass");
    assert.ok(tex.includes("Jane Perera"), "Must include candidate name");
    assert.ok(tex.includes("jane.p@example.com"), "Must include email");
    assert.ok(tex.includes("Virtusa \\& WSO2"), "Must escape company name ampersand");
    assert.ok(tex.includes("100\\%"), "Must escape percentage in summary");
    assert.ok(tex.includes("C\\#"), "Must escape hash in skills");
    assert.ok(tex.includes("University of Moratuwa"), "Must include education details");
    assert.ok(tex.includes("\\end{document}"), "Must properly close document");
});
