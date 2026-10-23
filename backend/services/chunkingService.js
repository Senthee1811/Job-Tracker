/**
 * Chunks text (CVs or job descriptions) by section (~300-500 tokens / 1200-2000 characters) with overlap.
 */

const SECTION_HEADERS = [
    /^(?:professional\s+)?summary/i,
    /^(?:work\s+)?experience/i,
    /^employment\s+history/i,
    /^education/i,
    /^(?:technical\s+)?skills/i,
    /^projects/i,
    /^certifications/i,
    /^requirements/i,
    /^qualifications/i,
    /^responsibilities/i,
    /^about\s+(?:the\s+)?role/i,
    /^benefits/i
];

/**
 * Splits plain text into logical section-aware chunks with ~300-500 tokens and overlap.
 *
 * @param {string} text - Raw text to chunk
 * @param {object} [options]
 * @param {number} [options.maxChars=1600] - Target max chunk length in chars (~400 tokens)
 * @param {number} [options.overlapChars=200] - Overlap in chars (~50 tokens)
 * @returns {Array<{ text: string, index: number, charCount: number }>}
 */
export const chunkText = (text, options = {}) => {
    if (!text || typeof text !== "string") return [];

    const { maxChars = 1600, overlapChars = 200 } = options;
    const clean = text.replace(/\r\n/g, "\n").trim();
    if (clean.length <= maxChars) {
        return [{ text: clean, index: 0, charCount: clean.length }];
    }

    // Split by paragraphs / double newlines
    const paragraphs = clean.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const chunks = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        if ((currentChunk + "\n\n" + paragraph).length <= maxChars) {
            currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
        } else {
            if (currentChunk) {
                chunks.push({
                    text: currentChunk,
                    index: chunkIndex++,
                    charCount: currentChunk.length
                });

                // Calculate overlap from end of current chunk
                const overlap = currentChunk.slice(Math.max(0, currentChunk.length - overlapChars));
                currentChunk = `${overlap}\n\n${paragraph}`;
            } else {
                // Single huge paragraph: slice by character window
                let start = 0;
                while (start < paragraph.length) {
                    const slice = paragraph.slice(start, start + maxChars);
                    chunks.push({
                        text: slice,
                        index: chunkIndex++,
                        charCount: slice.length
                    });
                    start += (maxChars - overlapChars);
                }
                currentChunk = "";
            }
        }
    }

    if (currentChunk.trim()) {
        chunks.push({
            text: currentChunk.trim(),
            index: chunkIndex++,
            charCount: currentChunk.length
        });
    }

    return chunks;
};
