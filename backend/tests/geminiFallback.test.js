import test from "node:test";
import assert from "node:assert";
import { getModelCascade, DEFAULT_FALLBACK_MODELS } from "../services/geminiService.js";

test("Gemini Model Cascade: includes primary model followed by configured fallback chain", () => {
    const cascade = getModelCascade();

    assert.ok(Array.isArray(cascade), "Cascade must be an array of model identifiers");
    assert.ok(cascade.length >= 4, "Cascade must contain primary model and fallback models");

    // Primary model must be the first candidate in the chain
    const primary = process.env.GEMINI_CHAT_MODEL || "gemini-3.8-flash";
    assert.strictEqual(cascade[0], primary, "Primary model must be evaluated first in the cascade");

    // All fallback models from the user's specification must be present
    const expectedFallbacks = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite"
    ];

    for (const model of expectedFallbacks) {
        assert.ok(cascade.includes(model), `Cascade must include fallback model ${model}`);
    }

    // Must have no duplicates
    const unique = new Set(cascade);
    assert.strictEqual(unique.size, cascade.length, "Cascade must have no duplicate model identifiers");
});
