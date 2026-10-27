import crypto from "crypto";
import AdmZip from "adm-zip";

/**
 * Standard section classification patterns.
 */
const SECTION_KEYWORDS = [
    { type: "summary", patterns: [/\b(professional\s+summary|executive\s+summary|summary|profile|about\s+me|career\s+objective|objective)\b/i] },
    { type: "skills", patterns: [/\b(technical\s+skills|core\s+competencies|skills\s*(?:&|and)\s*technologies|skills\s*(?:&|and)\s*tools|skills|technologies|proficiencies|areas\s+of\s+expertise)\b/i] },
    { type: "experience", patterns: [/\b(work\s+experience|professional\s+experience|employment\s+history|experience|relevant\s+experience|career\s+history|internship\s+experience|internships)\b/i] },
    { type: "education", patterns: [/\b(education\s*(?:&|and)\s*qualifications|academic\s+background|academic\s+qualifications|education|qualifications)\b/i] },
    { type: "projects", patterns: [/\b(projects\s*(?:&|and)\s*portfolio|featured\s+projects|academic\s+projects|personal\s+projects|key\s+projects|projects)\b/i] },
    { type: "certifications", patterns: [/\b(certifications\s*(?:&|and)\s*licenses|licenses\s*(?:&|and)\s*certifications|certifications|certificates)\b/i] },
    { type: "awards", patterns: [/\b(honors\s*(?:&|and)\s*awards|awards\s*(?:&|and)\s*achievements|awards|honors|achievements)\b/i] },
    { type: "languages", patterns: [/\b(languages|language\s+proficiency)\b/i] },
    { type: "publications", patterns: [/\b(publications|research\s+papers|research)\b/i] },
    { type: "volunteering", patterns: [/\b(volunteer\s+experience|volunteering|community\s+service)\b/i] },
    { type: "references", patterns: [/\b(references|referees)\b/i] }
];

const BULLET_CHAR_REGEX = /^[\s\t]*([•\-\*▪▸►–—\u2022\u2023\u25E6\u2043\u2219]|(?:\d+\.))\s+/;

/**
 * Classifies a heading string into a recognized sectionType or 'custom'.
 */
export const classifySectionType = (headingText = "") => {
    const clean = headingText.trim();
    for (const item of SECTION_KEYWORDS) {
        for (const pattern of item.patterns) {
            if (pattern.test(clean)) {
                return item.type;
            }
        }
    }
    return "custom";
};

/**
 * Detects whether a single line is a section heading.
 */
const isSectionHeading = (line, prevLine, nextLine) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 55 || trimmed.length < 3) return false;
    if (BULLET_CHAR_REGEX.test(trimmed)) return false;

    // Reject lines that look like dates or contact info
    if (/@/.test(trimmed) || /https?:\/\//.test(trimmed)) return false;
    if (/^\d{4}\s*[-–—]\s*(?:\d{4}|present)/i.test(trimmed)) return false;

    // Matches known section keywords
    const type = classifySectionType(trimmed);
    if (type !== "custom") {
        return true;
    }

    // Heuristics: All caps short line preceded by empty line or at start
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length <= 40;
    if (isAllCaps && (!prevLine || prevLine.trim() === "")) {
        return true;
    }

    // Title case with trailing colon or underlined feel
    if (/^[A-Z][A-Za-z\s&]{2,30}:?$/.test(trimmed) && (!prevLine || prevLine.trim() === "")) {
        return true;
    }

    return false;
};

/**
 * Extracts candidate contact information verbatim from the top lines of the document.
 */
export const extractContactBlock = (lines = []) => {
    const contactBlock = {
        rawText: "",
        name: "",
        email: "",
        phone: "",
        location: "",
        links: []
    };

    const headerLines = lines.slice(0, 15);
    const textSample = headerLines.join("\n");

    // Email
    const emailMatch = textSample.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) contactBlock.email = emailMatch[0];

    // Phone (international & standard formats)
    const phoneMatch = textSample.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 7) {
        contactBlock.phone = phoneMatch[0].trim();
    }

    // URLs / LinkedIn / GitHub
    const urlMatches = textSample.match(/(?:https?:\/\/[^\s,;]+|linkedin\.com\/in\/[^\s,;]+|github\.com\/[^\s,;]+)/gi) || [];
    contactBlock.links = urlMatches.map(url => {
        let label = "Link";
        if (/linkedin/i.test(url)) label = "LinkedIn";
        else if (/github/i.test(url)) label = "GitHub";
        else if (/portfolio|behance|medium/i.test(url)) label = "Portfolio";
        return { label, url: url.startsWith("http") ? url : `https://${url}` };
    });

    // Name heuristic: first line that is not an email, phone, URL, or section heading
    for (const line of headerLines) {
        const tr = line.trim();
        if (tr && !tr.includes("@") && !tr.startsWith("http") && !phoneMatch?.[0]?.includes(tr) && tr.length < 50) {
            // Must have letters
            if (/^[A-Za-z\s.'-]+$/.test(tr) && tr.split(/\s+/).length >= 2) {
                contactBlock.name = tr;
                break;
            }
        }
    }

    if (!contactBlock.name && headerLines[0]) {
        contactBlock.name = headerLines[0].trim().slice(0, 40);
    }

    // Location heuristic
    const locMatch = textSample.match(/\b([A-Za-z\s]+(?:,\s*[A-Za-z\s]+)?(?:Sri Lanka|Colombo|Kandy|Galle|United States|UK|Canada|Australia|Remote|Hybrid))\b/i);
    if (locMatch) {
        contactBlock.location = locMatch[0].trim();
    } else {
        contactBlock.location = "Sri Lanka";
    }

    contactBlock.rawText = headerLines.filter(l => l.trim()).join(" | ");
    return contactBlock;
};

/**
 * Detects style hints from the text and optional DOCX buffer.
 */
export const detectStyleHints = (rawText = "", docxBuffer = null) => {
    const hints = {
        columns: 1,
        bulletStyle: "•",
        dateFormat: "YYYY - Present",
        headingCase: "uppercase",
        fontHints: {
            family: "Helvetica",
            size: 10
        }
    };

    // Detect bullet style
    if (/^[ \t]*•/m.test(rawText)) hints.bulletStyle = "•";
    else if (/^[ \t]*-/m.test(rawText)) hints.bulletStyle = "-";
    else if (/^[ \t]*▸/m.test(rawText)) hints.bulletStyle = "▸";
    else if (/^[ \t]*▪/m.test(rawText)) hints.bulletStyle = "▪";

    // Detect date format
    if (/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i.test(rawText)) {
        hints.dateFormat = "MMM YYYY - Present";
    } else if (/\b\d{2}\/\d{4}\b/.test(rawText)) {
        hints.dateFormat = "MM/YYYY - Present";
    } else if (/\b\d{4}\s*[-–—]\s*(?:\d{4}|present)\b/i.test(rawText)) {
        hints.dateFormat = "YYYY - YYYY";
    }

    // Check DOCX XML if available for true native styles
    if (docxBuffer && Buffer.isBuffer(docxBuffer)) {
        try {
            const zip = new AdmZip(docxBuffer);
            const docXml = zip.readAsText("word/document.xml") || "";
            const stylesXml = zip.readAsText("word/styles.xml") || "";

            // Check font family in docx
            const fontMatch = docXml.match(/w:rFonts[^>]*w:ascii="([^"]+)"/) || stylesXml.match(/w:rFonts[^>]*w:ascii="([^"]+)"/);
            if (fontMatch && fontMatch[1]) {
                hints.fontHints.family = fontMatch[1];
            }

            // Check font size (half-points in OOXML, e.g. w:sz="20" means 10pt)
            const szMatch = docXml.match(/w:sz[^>]*w:val="(\d+)"/);
            if (szMatch && szMatch[1]) {
                hints.fontHints.size = Math.round(parseInt(szMatch[1], 10) / 2);
            }
        } catch (e) {
            // Graceful fallback to defaults
        }
    }

    return hints;
};

/**
 * Runs completeness check: verifies key tokens (emails, phones, URLs, years)
 * from the raw text appear in the parsed document model.
 */
export const runCompletenessCheck = (rawText = "", documentModel) => {
    const rawTokens = new Set();
    const modelTextPieces = [documentModel.contactBlock?.rawText || ""];

    // Collect all text from parsed document model
    for (const sec of documentModel.sections || []) {
        modelTextPieces.push(sec.heading);
        for (const blk of sec.blocks || []) {
            modelTextPieces.push(blk.text);
        }
    }
    const combinedModelText = modelTextPieces.join(" ");

    // Extract key tokens from rawText
    const emails = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phones = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g) || [];
    const years = rawText.match(/\b(19\d{2}|20\d{2})\b/g) || [];

    const missingTokens = [];

    emails.forEach(e => {
        if (!combinedModelText.includes(e)) missingTokens.push(`Email: ${e}`);
    });
    phones.filter(p => p.replace(/\D/g, "").length >= 7).slice(0, 2).forEach(p => {
        const cleanP = p.replace(/\D/g, "");
        if (!combinedModelText.replace(/\D/g, "").includes(cleanP)) missingTokens.push(`Phone: ${p}`);
    });
    const uniqueYears = Array.from(new Set(years));
    uniqueYears.forEach(y => {
        if (!combinedModelText.includes(y)) missingTokens.push(`Year: ${y}`);
    });

    // Check if essential contact tokens are missing overall
    if (!documentModel.contactBlock?.email) {
        missingTokens.push("Email address not found");
    }
    if (!documentModel.contactBlock?.phone) {
        missingTokens.push("Phone number not found");
    }


    const rawCharCount = rawText.trim().length;
    const modelCharCount = combinedModelText.trim().length;
    const coveragePercentage = rawCharCount > 0
        ? Math.min(100, Math.round((modelCharCount / rawCharCount) * 100))
        : 100;

    const status = (coveragePercentage >= 80 && missingTokens.length === 0) ? "verified" : "warning";


    return {
        originalCharCount: rawCharCount,
        modelCharCount,
        coveragePercentage,
        missingTokens,
        status
    };
};

/**
 * Parses raw CV text into an ordered, structure-preserving DocumentModel.
 *
 * @param {string} rawText - Verbatim extracted text
 * @param {string} originalFilename - File name
 * @param {Buffer} [rawBuffer=null] - Optional raw binary buffer (for DOCX styling extraction)
 * @returns {object} DocumentModel
 */
export const parseCvToDocumentModel = (rawText = "", originalFilename = "resume.pdf", rawBuffer = null) => {
    if (!rawText || typeof rawText !== "string") {
        rawText = "";
    }

    const lines = rawText.split(/\r?\n/);
    const contactBlock = extractContactBlock(lines);
    const styleHints = detectStyleHints(rawText, rawBuffer);

    const sections = [];
    let currentSection = null;
    let sectionIdx = 0;
    let blockCounter = 0;

    // Helper to start a new section
    const startNewSection = (heading, lineIdx) => {
        const sectionId = `sec_${sectionIdx++}_${classifySectionType(heading)}`;
        currentSection = {
            id: sectionId,
            heading: heading.trim(),
            originalHeading: heading.trim(),
            sectionType: classifySectionType(heading),
            orderIndex: sections.length,
            blocks: []
        };
        sections.push(currentSection);
    };

    // Helper to add block to current section
    const addBlock = (text, isBullet = false, bulletChar = "•", metadata = {}) => {
        if (!currentSection) {
            // First section default to Summary or Profile if content appears before first explicit heading
            startNewSection("PROFESSIONAL SUMMARY", 0);
        }
        const blkId = `blk_${currentSection.id}_${blockCounter++}`;
        currentSection.blocks.push({
            id: blkId,
            blockType: isBullet ? "bullet" : (metadata.title || metadata.company ? "entry_header" : "paragraph"),
            text: text.trim(),
            originalText: text.trim(),
            isBullet,
            bulletChar,
            isEdited: false,
            metadata
        });
    };

    // Process lines
    let inHeaderZone = true;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) continue;

        // Skip initial contact lines if they match contact info
        if (inHeaderZone) {
            if (trimmed === contactBlock.name ||
                trimmed.includes(contactBlock.email) ||
                (contactBlock.phone && trimmed.includes(contactBlock.phone)) ||
                trimmed.startsWith("http") ||
                trimmed.includes("linkedin.com") ||
                trimmed.includes("github.com")) {
                continue;
            }
        }

        const prevLine = i > 0 ? lines[i - 1] : "";
        const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

        // Check if line is a section heading
        if (isSectionHeading(line, prevLine, nextLine)) {
            inHeaderZone = false;
            startNewSection(trimmed, i);
            continue;
        }

        inHeaderZone = false;

        // Check if line is a bullet item
        const bulletMatch = trimmed.match(BULLET_CHAR_REGEX);
        if (bulletMatch) {
            const cleanBulletText = trimmed.replace(BULLET_CHAR_REGEX, "").trim();
            const char = bulletMatch[1] || "•";
            addBlock(cleanBulletText, true, char);
            continue;
        }

        // Check if line looks like an entry header (Role, Company, Dates)
        // e.g. "Software Engineer | ABC Corp | 2022 - Present" or "ABC Corp — Software Engineer"
        const hasDate = /\b(?:19|20)\d{2}\b/i.test(trimmed);
        const hasDelimiter = /[\/|—–-]/.test(trimmed);
        if (hasDate && hasDelimiter && trimmed.length < 90) {
            const parts = trimmed.split(/[\/|—–-]/).map(p => p.trim());
            const meta = {
                dates: parts.find(p => /\b(?:19|20)\d{2}\b/.test(p)) || "",
                title: parts[0] || "",
                company: parts[1] || ""
            };
            addBlock(trimmed, false, "", meta);
            continue;
        }

        // Otherwise normal paragraph block
        addBlock(trimmed, false, "");
    }

    // Build sectionOrder array
    const sectionOrder = sections.map(s => s.id);

    // Compute entries & rawItems convenience properties for structured rendering & inspection
    for (const sec of sections) {
        sec.type = sec.sectionType;
        if (sec.sectionType === "experience" || sec.sectionType === "projects" || sec.sectionType === "education") {
            const entries = [];
            let currentEntry = null;
            for (const blk of sec.blocks) {
                if (blk.blockType === "entry_header" || blk.metadata?.company || blk.metadata?.dates || blk.metadata?.title) {
                    currentEntry = {
                        title: blk.metadata?.title || blk.text,
                        company: blk.metadata?.company || "",
                        dates: blk.metadata?.dates || "",
                        headerBlockId: blk.id,
                        bullets: []
                    };
                    entries.push(currentEntry);
                } else if (blk.isBullet) {
                    if (!currentEntry) {
                        currentEntry = { title: "Role", company: "", dates: "", bullets: [] };
                        entries.push(currentEntry);
                    }
                    currentEntry.bullets.push({
                        id: blk.id,
                        text: blk.text,
                        originalText: blk.originalText
                    });
                }
            }
            sec.entries = entries;
        } else if (sec.sectionType === "skills") {
            const rawItems = [];
            for (const blk of sec.blocks) {
                const tokens = blk.text.split(/[,•|/]/).map(s => s.trim()).filter(Boolean);
                rawItems.push(...tokens);
            }
            sec.rawItems = rawItems;
        }
    }

    const docModel = {
        filename: originalFilename,
        contactBlock,
        contact: contactBlock,
        sections,
        sectionOrder,
        styleHints
    };

    docModel.completenessCheck = runCompletenessCheck(rawText, docModel);
    return docModel;
};

/**
 * Applies validated edits to a DocumentModel, generating both original and tailored copies.
 */
export const applyEditsToDocumentModel = (originalModel, validatedEdits = {}) => {
    // Deep clone original
    const tailoredModel = JSON.parse(JSON.stringify(originalModel));
    tailoredModel.contact = tailoredModel.contactBlock;

    const { summaryEdit, skillsReorder, bulletEdits = [], sectionReorder = null } = validatedEdits;

    // 1. Summary edit
    const summaryNewText = summaryEdit?.newText || summaryEdit?.tailoredText;
    if (summaryEdit && summaryEdit.blockId && summaryNewText) {
        for (const sec of tailoredModel.sections) {
            const block = sec.blocks.find(b => b.id === summaryEdit.blockId);
            if (block) {
                block.text = summaryNewText.trim();
                block.isEdited = true;
                block.editReason = summaryEdit.reason || "Aligned with job requirements";
                break;
            }
        }
    }

    // 2. Skills reorder
    if (skillsReorder) {
        if (Array.isArray(skillsReorder.reorderedBlockIds)) {
            for (const sec of tailoredModel.sections) {
                if (sec.sectionType === "skills" || sec.id === skillsReorder.sectionId) {
                    const blockMap = new Map(sec.blocks.map(b => [b.id, b]));
                    const newBlocks = [];
                    // Push reordered blocks
                    skillsReorder.reorderedBlockIds.forEach(id => {
                        if (blockMap.has(id)) {
                            newBlocks.push(blockMap.get(id));
                            blockMap.delete(id);
                        }
                    });
                    // Append any remaining blocks
                    for (const remaining of blockMap.values()) {
                        newBlocks.push(remaining);
                    }
                    sec.blocks = newBlocks;
                    break;
                }
            }
        } else if (Array.isArray(skillsReorder.tailoredOrder)) {
            for (const sec of tailoredModel.sections) {
                if (sec.sectionType === "skills") {
                    const targetOrder = skillsReorder.tailoredOrder.map(s => s.toLowerCase().trim());
                    sec.blocks.sort((a, b) => {
                        const aIdx = targetOrder.indexOf(a.text.toLowerCase().trim());
                        const bIdx = targetOrder.indexOf(b.text.toLowerCase().trim());
                        const aScore = aIdx === -1 ? 999 : aIdx;
                        const bScore = bIdx === -1 ? 999 : bIdx;
                        return aScore - bScore;
                    });
                    break;
                }
            }
        }
    }

    // 3. Bullet edits
    if (Array.isArray(bulletEdits)) {
        const editMap = new Map(bulletEdits.map(e => [e.blockId, e]));
        for (const sec of tailoredModel.sections) {
            for (const block of sec.blocks) {
                if (editMap.has(block.id)) {
                    const edit = editMap.get(block.id);
                    const newText = edit.newText || edit.tailoredText;
                    if (newText && !edit.rejected) {
                        block.text = newText.trim();
                        block.isEdited = true;
                        block.editReason = edit.reason || "Reworded for job keywords";
                    }
                }
            }
        }
    }

    // Refresh entries & rawItems on tailoredModel
    for (const sec of tailoredModel.sections) {
        sec.type = sec.sectionType;
        if (sec.sectionType === "experience" || sec.sectionType === "projects" || sec.sectionType === "education") {
            const entries = [];
            let currentEntry = null;
            for (const blk of sec.blocks) {
                if (blk.blockType === "entry_header" || blk.metadata?.company || blk.metadata?.dates || blk.metadata?.title) {
                    currentEntry = {
                        title: blk.metadata?.title || blk.text,
                        company: blk.metadata?.company || "",
                        dates: blk.metadata?.dates || "",
                        headerBlockId: blk.id,
                        bullets: []
                    };
                    entries.push(currentEntry);
                } else if (blk.isBullet) {
                    if (!currentEntry) {
                        currentEntry = { title: "Role", company: "", dates: "", bullets: [] };
                        entries.push(currentEntry);
                    }
                    currentEntry.bullets.push({
                        id: blk.id,
                        text: blk.text,
                        originalText: blk.originalText
                    });
                }
            }
            sec.entries = entries;
        } else if (sec.sectionType === "skills") {
            const rawItems = [];
            for (const blk of sec.blocks) {
                const tokens = blk.text.split(/[,•|/]/).map(s => s.trim()).filter(Boolean);
                rawItems.push(...tokens);
            }
            sec.rawItems = rawItems;
        }
    }

    // 4. Section reorder
    if (Array.isArray(sectionReorder) && sectionReorder.length === tailoredModel.sectionOrder.length) {
        const validIds = new Set(tailoredModel.sectionOrder);
        const allMatch = sectionReorder.every(id => validIds.has(id));
        if (allMatch) {
            tailoredModel.sectionOrder = [...sectionReorder];
            tailoredModel.sections.sort((a, b) => {
                return sectionReorder.indexOf(a.id) - sectionReorder.indexOf(b.id);
            });
        }
    }

    return {
        originalModel,
        tailoredModel
    };
};


/**
 * In-place DOCX editor: replaces the text runs of edited blocks inside word/document.xml
 * while 100% preserving all formatting, fonts, margins, tables, colors, and styles!
 *
 * @param {Buffer} docxBuffer - Original uploaded DOCX buffer
 * @param {object} originalModel - Unedited DocumentModel
 * @param {Array} bulletEdits - Array of accepted edits { blockId, originalText, newText }
 * @returns {Buffer} Modified DOCX binary buffer
 */
export const applyEditsToDocxBuffer = (docxBuffer, originalModel, bulletEdits = []) => {
    if (!docxBuffer || !Buffer.isBuffer(docxBuffer)) {
        throw new Error("Invalid DOCX buffer provided for in-place editing");
    }

    const zip = new AdmZip(docxBuffer);
    let docXml = zip.readAsText("word/document.xml");
    if (!docXml) {
        throw new Error("Could not find word/document.xml in DOCX archive");
    }

    const editMap = new Map();
    (bulletEdits || []).forEach(e => {
        if (e.originalText && e.newText && !e.rejected) {
            editMap.set(e.originalText.trim(), e.newText.trim());
        }
    });

    if (editMap.size === 0) {
        return docxBuffer; // No edits to apply
    }

    // Replace text runs in XML
    // In Word XML, text is enclosed inside <w:t>...</w:t> tags within paragraphs <w:p>
    for (const [origText, newText] of editMap.entries()) {
        const escapedOrig = origText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Simple direct match in single <w:t> tag
        const singleTagRegex = new RegExp(`(<w:t[^>]*>)([^<]*${escapedOrig}[^<]*)(<\\/w:t>)`, 'g');
        if (singleTagRegex.test(docXml)) {
            docXml = docXml.replace(singleTagRegex, (match, openTag, content, closeTag) => {
                return `${openTag}${content.replace(origText, newText)}${closeTag}`;
            });
            continue;
        }

        // Split-run replacement across paragraphs:
        // Match paragraph containing the first few words of the target text
        const snippet = origText.slice(0, Math.min(30, origText.length));
        const escapedSnippet = snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pRegex = new RegExp(`(<w:p\\b[^>]*>[\\s\\S]*?${escapedSnippet}[\\s\\S]*?<\\/w:p>)`, 'g');

        docXml = docXml.replace(pRegex, (pXml) => {
            // Extract all text inside this paragraph
            const fullPText = (pXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
                .map(t => t.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
                .join('');

            if (fullPText.includes(origText)) {
                let replaced = false;
                // Put the replacement in the first <w:t> tag and empty subsequent matching runs
                return pXml.replace(/(<w:t[^>]*>)([^<]*)(<\/w:t>)/g, (match, openTag, textContent, closeTag) => {
                    if (!replaced) {
                        replaced = true;
                        return `${openTag}${newText}${closeTag}`;
                    }
                    return `${openTag}${closeTag}`;
                });
            }
            return pXml;
        });
    }

    zip.updateFile("word/document.xml", Buffer.from(docXml, "utf-8"));
    return zip.toBuffer();
};
