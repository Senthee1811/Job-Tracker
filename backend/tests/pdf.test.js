import test from "node:test";
import assert from "node:assert";
import { generateAtsPdfBuffer } from "../services/pdfService.js";

test("PDF generator: creates valid ATS single-column PDF buffer", async () => {
    const candidate = {
        firstname: "Sentheepan",
        lastname: "Dev",
        email: "senthee@example.com",
        linkedin: "linkedin.com/in/senthee",
        location: "Colombo, Sri Lanka"
    };

    const tailoredData = {
        summary: "Results-driven Software Engineer with 3+ years experience building modern web architectures.",
        highlightedSkills: ["React", "Node.js", "TypeScript", "Tailwind CSS"],
        experience: [
            {
                company: "Tech Enterprise",
                role: "Full Stack Developer",
                duration: "2023 - Present",
                bullets: [
                    "Engineered responsive React frontends and high throughput Express APIs.",
                    "Improved query efficiency by 40% with database indexing."
                ]
            }
        ],
        education: [
            { degree: "BSc in Computer Science", institution: "University of Colombo", year: "2023" }
        ],
        projects: [
            { title: "Job Tracker System", description: "Real-time vacancy tracking and RAG matching.", technologies: ["React", "Node.js"] }
        ]
    };

    const buffer = await generateAtsPdfBuffer(candidate, tailoredData);

    assert.ok(Buffer.isBuffer(buffer), "Should return a Buffer");
    assert.ok(buffer.length > 500, "PDF buffer should contain generated PDF bytes");
    // PDF files start with %PDF
    assert.strictEqual(buffer.slice(0, 4).toString(), "%PDF");
});
