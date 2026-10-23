import test from "node:test";
import assert from "node:assert";
import { extractTextFromBuffer } from "../services/cvParserService.js";

test("extractTextFromBuffer: extracts plain text correctly", async () => {
    const sampleText = "Experienced Full Stack Engineer with expertise in React, Node.js, and MongoDB.";
    const buffer = Buffer.from(sampleText, "utf-8");
    const extracted = await extractTextFromBuffer(buffer, "resume.txt", "text/plain");

    assert.strictEqual(extracted, sampleText);
});

test("extractTextFromBuffer: throws for empty buffer", async () => {
    await assert.rejects(
        async () => {
            await extractTextFromBuffer(Buffer.from(""), "resume.txt");
        },
        /Cannot extract text from empty buffer/
    );
});

test("extractTextFromBuffer: rejects unsupported file formats", async () => {
    const buffer = Buffer.from("random binary data", "utf-8");
    await assert.rejects(
        async () => {
            await extractTextFromBuffer(buffer, "resume.exe");
        },
        /Unsupported file type/
    );
});
