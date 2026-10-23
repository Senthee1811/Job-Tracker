import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";
import path from "path";

/**
 * Extracts plain text from a resume/CV file buffer (PDF, DOCX, or TXT).
 * Supports both pdf-parse v1 (function) and v2 (PDFParse class).
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename with extension
 * @param {string} [mimeType] - Optional MIME type
 * @returns {Promise<string>} Extracted and trimmed plain text
 */
export const extractTextFromBuffer = async (buffer, originalName = "", mimeType = "") => {
    if (!buffer || buffer.length === 0) {
        throw new Error("Cannot extract text from empty buffer");
    }

    const ext = path.extname(originalName).toLowerCase();

    // 1. PDF Parsing
    if (ext === ".pdf" || mimeType === "application/pdf") {
        try {
            // pdf-parse v2 (Class-based)
            if (pdfParseModule.PDFParse) {
                const parser = new pdfParseModule.PDFParse({ data: buffer });
                const result = await parser.getText();
                const text = result?.text || "";
                if (typeof parser.destroy === "function") {
                    await parser.destroy();
                }
                return text.trim();
            }

            // pdf-parse v1 (Function-based)
            const parseFn = pdfParseModule.default || pdfParseModule;
            if (typeof parseFn === "function") {
                const data = await parseFn(buffer);
                return (data?.text || "").trim();
            }

            throw new Error("Unable to locate compatible PDF parsing method");
        } catch (error) {
            console.error("PDF Parsing Error:", error.message);
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }

    // 2. DOCX Parsing
    if (
        ext === ".docx" ||
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        try {
            const { value } = await mammoth.extractRawText({ buffer });
            return (value || "").trim();
        } catch (error) {
            console.error("DOCX Parsing Error:", error.message);
            throw new Error(`Failed to parse DOCX: ${error.message}`);
        }
    }

    // 3. Plain Text fallback
    if (ext === ".txt" || mimeType.startsWith("text/")) {
        return buffer.toString("utf-8").trim();
    }

    throw new Error(`Unsupported file type: ${ext || mimeType || "unknown"}. Only PDF, DOCX, and TXT are supported.`);
};
