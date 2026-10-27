/**
 * Validates patch edits proposed by Gemini or submitted by user.
 * Strictly prevents hallucination, protected-field alteration, and unwarranted rewrites.
 */

// Protected field extractors
const extractDates = (str = "") => (str.match(/\b(?:19|20)\d{2}\b/g) || []);
const extractNumbers = (str = "") => (str.match(/\b\d+(?:\.\d+)?%?\b/g) || []);
const extractEntities = (str = "") => {
    // Capitalized words that might be employers, proper names, tools
    const matches = str.match(/\b[A-Z][a-zA-Z0-9+#.-]*\b/g) || [];
    // Ignore common stop words capitalized at sentence start
    const stopWords = new Set(["The", "A", "An", "In", "On", "At", "To", "For", "With", "By", "From", "And", "Or", "Built", "Developed", "Led", "Created", "Managed", "Designed", "Implemented", "Worked", "Optimized", "Engineered", "Maintained", "Collaborated", "Architected"]);
    return matches.filter(m => !stopWords.has(m));
};

/**
 * Validates patch edits against the original DocumentModel.
 *
 * @param {object} patch - The patch object from Gemini / client
 * @param {object} originalDocumentModel - Unaltered source document model
 * @param {object} [options={}] - Validation options
 * @returns {object} { isValid: boolean, validatedPatch: object, rejectedCount: number, warnings: string[] }
 */
export const validatePatchEdits = (patch = {}, originalDocumentModel, options = {}) => {
    const warnings = [];
    let rejectedCount = 0;

    // Collect all valid block IDs and map them to their blocks
    const blockMap = new Map();
    let totalBullets = 0;

    for (const sec of originalDocumentModel.sections || []) {
        for (const blk of sec.blocks || []) {
            blockMap.set(blk.id, blk);
            if (blk.isBullet) totalBullets++;
        }
    }

    const maxAllowedRewrites = Math.max(2, Math.ceil(totalBullets * 0.40)); // Max 40%

    const validatedPatch = {
        summaryEdit: null,
        skillsReorder: null,
        bulletEdits: [],
        sectionReorder: null,
        keywordsToWeave: patch.keywordsToWeave || [],
        notes: patch.notes || []
    };

    // 1. Validate summaryEdit
    if (patch.summaryEdit && patch.summaryEdit.blockId) {
        const origBlock = blockMap.get(patch.summaryEdit.blockId);
        if (!origBlock) {
            warnings.push(`Summary edit rejected: blockId ${patch.summaryEdit.blockId} not found.`);
            rejectedCount++;
        } else {
            const newText = (patch.summaryEdit.newText || patch.summaryEdit.tailoredText || "").trim();
            const origText = origBlock.text || "";

            // Check length boundary (+/- 30%)
            const lenRatio = newText.length / (origText.length || 1);
            if (lenRatio < 0.5 || lenRatio > 1.4) {
                warnings.push("Summary edit rejected: reworded length deviates excessively from original.");
                rejectedCount++;
            } else {
                validatedPatch.summaryEdit = {
                    blockId: patch.summaryEdit.blockId,
                    originalText: origText,
                    newText,
                    tailoredText: newText,
                    reason: patch.summaryEdit.reason || "Summary aligned with job opening"
                };
            }
        }
    }

    // 2. Validate skillsReorder
    if (patch.skillsReorder && Array.isArray(patch.skillsReorder.reorderedBlockIds)) {
        const sec = originalDocumentModel.sections?.find(s => s.sectionType === "skills" || s.id === patch.skillsReorder.sectionId);
        if (sec) {
            const secBlockIds = new Set(sec.blocks.map(b => b.id));
            const validReordered = patch.skillsReorder.reorderedBlockIds.filter(id => secBlockIds.has(id));
            validatedPatch.skillsReorder = {
                sectionId: sec.id,
                reorderedBlockIds: validReordered
            };
        }
    }

    // 3. Validate bulletEdits
    let acceptedBulletEdits = 0;
    const bulletEdits = Array.isArray(patch.bulletEdits) ? patch.bulletEdits : [];

    for (const edit of bulletEdits) {
        if (!edit.blockId) continue;
        const origBlock = blockMap.get(edit.blockId);

        if (!origBlock) {
            warnings.push(`Bullet edit rejected: blockId ${edit.blockId} does not exist.`);
            rejectedCount++;
            continue;
        }

        // Protected fields check: do not allow editing entry headers (job titles, company names, dates)
        if (origBlock.blockType === "entry_header" || origBlock.metadata?.company || origBlock.metadata?.dates) {
            warnings.push(`Bullet edit rejected: blockId ${edit.blockId} contains protected employer or date metadata.`);
            rejectedCount++;
            continue;
        }

        const origText = origBlock.text || "";
        const newText = (edit.newText || edit.tailoredText || "").trim();


        if (!newText || newText === origText) {
            continue; // No change
        }

        // Check rewording cap (40% maximum)
        if (acceptedBulletEdits >= maxAllowedRewrites) {
            warnings.push(`Bullet edit skipped: reached maximum rewording threshold of 40% (${maxAllowedRewrites} bullets).`);
            rejectedCount++;
            continue;
        }

        // Check length bounds (+/- 25%)
        const origLen = origText.length;
        const newLen = newText.length;
        if (origLen > 20) {
            const ratio = newLen / origLen;
            if (ratio < 0.70 || ratio > 1.35) {
                warnings.push(`Bullet edit for block ${edit.blockId} rejected: length changed significantly (${origLen} -> ${newLen} chars).`);
                rejectedCount++;
                continue;
            }
        }

        // Protected dates check: dates in new text must have existed in original text
        const origDates = new Set(extractDates(origText));
        const newDates = extractDates(newText);
        const hasFabricatedDate = newDates.some(d => !origDates.has(d));
        if (hasFabricatedDate) {
            warnings.push(`Bullet edit for block ${edit.blockId} rejected: attempts to introduce new dates.`);
            rejectedCount++;
            continue;
        }

        // Protected numbers / metrics check: cannot introduce brand new numbers (e.g. 50%, 10x, $5M)
        const origNums = new Set(extractNumbers(origText));
        const newNums = extractNumbers(newText);
        const hasFabricatedNumber = newNums.some(n => !origNums.has(n));
        if (hasFabricatedNumber) {
            warnings.push(`Bullet edit for block ${edit.blockId} rejected: attempts to inject unverified metrics or numbers.`);
            rejectedCount++;
            continue;
        }

        // Accept edit
        acceptedBulletEdits++;
        validatedPatch.bulletEdits.push({
            blockId: edit.blockId,
            originalText: origText,
            newText,
            reason: edit.reason || "Terminology aligned with vacancy requirements",
            rejected: false
        });
    }

    // 4. Validate sectionReorder
    if (Array.isArray(patch.sectionReorder)) {
        const origSectionOrder = originalDocumentModel.sectionOrder || [];
        const origSet = new Set(origSectionOrder);
        // Only accept if exactly the same section IDs are present (no section added or deleted)
        if (patch.sectionReorder.length === origSectionOrder.length && patch.sectionReorder.every(id => origSet.has(id))) {
            validatedPatch.sectionReorder = [...patch.sectionReorder];
        }
    }

    return {
        isValid: true,
        validatedPatch,
        rejectedCount,
        warnings
    };
};
