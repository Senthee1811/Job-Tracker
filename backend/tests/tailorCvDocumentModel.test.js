import test from "node:test";
import assert from "node:assert";
import {
    parseCvToDocumentModel,
    applyEditsToDocumentModel
} from "../services/documentModelService.js";
import { validatePatchEdits } from "../services/patchValidationService.js";
import { renderLatexFromDocumentModel } from "../lib/latexUtils.js";
import { generateDocumentModelPdfBuffer } from "../services/pdfService.js";

const sampleCvText = `
Alexander Hamilton
New York, NY | (212) 555-1776 | alex@treasury.gov | linkedin.com/in/alexhamilton

SUMMARY
Senior Financial Architect and Systems Engineer with 10+ years architecting robust fiscal systems and scalable transactional platforms.

PROFESSIONAL EXPERIENCE
Department of the Treasury - New York, NY
Secretary of the Treasury | 1789 - 1795
- Established the First Bank of the United States, managing $10M in capital capitalization.
- Authored the Report on Public Credit, stabilizing sovereign debt across 13 member states.
- Implemented nationwide customs collection infrastructure, improving tariff collection efficiency by 45%.

Bank of New York - New York, NY
Founding Director | 1784 - 1789
- Drafted initial bank constitution and capitalized initial $500,000 in gold and silver specie.
- Architected credit underwriting rules, reducing loan default rate by 18%.

EDUCATION
King's College (Columbia University) - New York, NY
Bachelor of Arts in Economics & Law | 1776

SKILLS & EXPERTISE
Fiscal Modeling, Treasury Operations, Public Credit, Transaction Processing, Governance, System Architecture
`;

test("Test 1: Round-trip test (unedited CV preserves identical structure, headings, dates, and contact details)", async () => {
    // 1. Parse CV to DocumentModel
    const docModel = parseCvToDocumentModel(sampleCvText, "alexander_hamilton.pdf");

    assert.ok(docModel.sections.length >= 4, "Must parse at least 4 sections");
    assert.strictEqual(docModel.contact.name, "Alexander Hamilton");
    assert.strictEqual(docModel.contact.email, "alex@treasury.gov");
    assert.ok(docModel.contact.phone.includes("555-1776"));

    // Check headings preservation
    const originalHeadings = docModel.sections.map((s) => s.heading);
    assert.ok(originalHeadings.includes("SUMMARY"));
    assert.ok(originalHeadings.includes("PROFESSIONAL EXPERIENCE"));
    assert.ok(originalHeadings.includes("EDUCATION"));
    assert.ok(originalHeadings.includes("SKILLS & EXPERTISE"));

    // 2. Pass empty patch to applyEditsToDocumentModel
    const { tailoredModel } = applyEditsToDocumentModel(docModel, {});

    // Ensure identical section order and headings
    const tailoredHeadings = tailoredModel.sections.map((s) => s.heading);
    assert.deepStrictEqual(tailoredHeadings, originalHeadings, "Section headings and order must be 100% identical");

    // Ensure company and date metadata untouched
    const origExp = docModel.sections.find((s) => s.type === "experience" || s.sectionType === "experience");
    const tailExp = tailoredModel.sections.find((s) => s.type === "experience" || s.sectionType === "experience");
    assert.strictEqual(origExp.entries[0].company, tailExp.entries[0].company);
    assert.strictEqual(origExp.entries[0].dates, tailExp.entries[0].dates);
    assert.strictEqual(origExp.entries[0].title, tailExp.entries[0].title);

    // Ensure PDF compilation succeeds without error
    const pdfBuffer = await generateDocumentModelPdfBuffer(tailoredModel);
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 500);

    // Ensure LaTeX compilation reflects identical sequence
    const texSource = renderLatexFromDocumentModel(tailoredModel);
    assert.ok(texSource.includes("Alexander Hamilton"));
    assert.ok(texSource.includes("PROFESSIONAL EXPERIENCE"));
    assert.ok(texSource.includes("First Bank of the United States"));
});

test("Test 2: Protected-field test (rejects tampering with dates, employers, degrees, and fabricated numbers)", () => {
    const docModel = parseCvToDocumentModel(sampleCvText, "alexander_hamilton.pdf");
    const expSec = docModel.sections.find((s) => s.type === "experience" || s.sectionType === "experience");
    const targetBulletId = expSec.entries[0].bullets[0].id;

    // A. Malicious patch attempting to change dates and employer
    const maliciousPatch1 = {
        bulletEdits: [
            {
                blockId: targetBulletId,
                originalText: "Established the First Bank of the United States, managing $10M in capital capitalization.",
                tailoredText: "Worked at Google in 2025 as Senior VP managing 999% profit growth."
            }
        ]
    };

    const validation1 = validatePatchEdits(maliciousPatch1, docModel);
    assert.ok(
        validation1.warnings.some((w) =>
            w.includes("unverified metrics") ||
            w.includes("introduce new dates") ||
            w.includes("protected") ||
            w.includes("length changed")
        ),
        "Validator must flag fabricated metrics or protected field tampering"
    );

    // B. Attempting to edit non-existent block ID
    const maliciousPatch2 = {
        bulletEdits: [
            {
                blockId: "fake_non_existent_block_999",
                originalText: "None",
                tailoredText: "Fake bullet"
            }
        ]
    };

    const validation2 = validatePatchEdits(maliciousPatch2, docModel);
    assert.strictEqual(
        validation2.validatedPatch.bulletEdits.length,
        0,
        "Validator must reject edits targeting non-existent block IDs"
    );
    assert.ok(
        validation2.warnings.some((w) => w.includes("does not exist") || w.includes("not found")),
        "Validator must log warning for missing block ID"
    );
});

test("Test 3: Parser completeness test (token coverage and warning detection)", () => {
    // 1. Full completeness CV
    const fullDoc = parseCvToDocumentModel(sampleCvText, "alex.pdf");
    assert.ok(fullDoc.completenessCheck, "DocumentModel must include completenessCheck");
    assert.strictEqual(fullDoc.completenessCheck.status, "verified");
    assert.ok(fullDoc.completenessCheck.coveragePercentage >= 80);

    // 2. Incomplete CV missing email and contact info
    const sparseText = `
Random Unstructured Notes
Did some programming in 2020.
Skills: C++, Assembly
    `;
    const sparseDoc = parseCvToDocumentModel(sparseText, "sparse.pdf");
    assert.ok(sparseDoc.completenessCheck);
    // Expect warning or missing contact items
    assert.ok(
        sparseDoc.completenessCheck.missingTokens.some((t) => t.includes("Email") || t.includes("Phone")),
        "Sparse CV should flag missing email or contact details in completeness check"
    );
});

test("Test 4: Edit-application test (only targeted blocks change; non-targeted items remain verbatim)", () => {
    const docModel = parseCvToDocumentModel(sampleCvText, "alexander_hamilton.pdf");
    const expSec = docModel.sections.find((s) => s.type === "experience" || s.sectionType === "experience");
    const targetBullet = expSec.entries[0].bullets[0];
    const nonTargetBullet = expSec.entries[0].bullets[1];

    const patch = {
        bulletEdits: [
            {
                blockId: targetBullet.id,
                originalText: targetBullet.text,
                tailoredText: "Spearheaded the First Bank of the United States, overseeing $10M in capital capitalization.",
                reason: "Active action verb tailoring"
            }
        ],
        skillsReorder: {
            tailoredOrder: ["Governance", "System Architecture", "Fiscal Modeling"],
            rationale: "Align with system engineering vacancy"
        }
    };

    const { tailoredModel } = applyEditsToDocumentModel(docModel, patch);
    const tailoredExp = tailoredModel.sections.find((s) => s.type === "experience" || s.sectionType === "experience");

    // Targeted bullet changed
    assert.strictEqual(
        tailoredExp.entries[0].bullets[0].text,
        "Spearheaded the First Bank of the United States, overseeing $10M in capital capitalization."
    );

    // Non-targeted bullet is strictly identical to original
    assert.strictEqual(
        tailoredExp.entries[0].bullets[1].text,
        nonTargetBullet.text,
        "Non-targeted bullet must be verbatim and untouched"
    );

    // Education entries strictly identical
    const origEdu = docModel.sections.find((s) => s.type === "education" || s.sectionType === "education");
    const tailEdu = tailoredModel.sections.find((s) => s.type === "education" || s.sectionType === "education");
    assert.deepStrictEqual(origEdu.entries, tailEdu.entries, "Education must remain 100% untouched");
});
