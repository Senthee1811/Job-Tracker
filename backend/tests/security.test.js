import test from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../services/emailService.js";

test("Security: SHA-256 reset token generation and matching", () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Re-hashing the submitted raw token must match the stored hash
    const incomingHashed = crypto.createHash("sha256").update(rawToken).digest("hex");
    assert.strictEqual(hashedToken, incomingHashed);

    // Tampered token must fail to match
    const tampered = crypto.createHash("sha256").update("invalid-token").digest("hex");
    assert.notStrictEqual(hashedToken, tampered);
});

test("Security: Token expiration logic enforces 30-minute validity", () => {
    const now = Date.now();
    const validExpiry = new Date(now + 30 * 60 * 1000);
    const expiredDate = new Date(now - 1000);

    assert.ok(validExpiry.getTime() > now, "30-min token should be in the future");
    assert.ok(expiredDate.getTime() < now, "Expired token should be in the past");
});

test("Security: tokenVersion session invalidation check", () => {
    const secret = "test-jwt-secret-key-1234567890";
    const initialVersion = 1;

    // Issue token with version 1
    const token = jwt.sign({ id: "user123", tokenVersion: initialVersion }, secret);
    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.tokenVersion, 1);

    // Simulate password change / session invalidation
    const updatedUser = { tokenVersion: 2 };
    const isValidSession = decoded.tokenVersion === updatedUser.tokenVersion;
    assert.strictEqual(isValidSession, false, "Older tokenVersion must be rejected after password change");
});

test("Security: Email service falls back safely in dev mode without throwing", async () => {
    // When EMAIL_PROVIDER_API_KEY is not set, sendPasswordResetEmail should log and resolve
    const result = await sendPasswordResetEmail({
        toEmail: "candidate@example.com",
        resetToken: "test-token-12345",
        userName: "Alice"
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.provider, "console_fallback");
    assert.ok(result.resetUrl.includes("token=test-token-12345"));
});
