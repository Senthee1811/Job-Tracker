import test from "node:test";
import assert from "node:assert";
import { generateSignedDownloadUrl, isCloudinaryConfigured } from "../services/cloudinaryService.js";
import { CV } from "../models/CV.js";
import { TailoredCV } from "../models/TailoredCV.js";

test("Cloudinary Service: generates short-lived signed URL for authenticated raw assets", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "demo-cloud";
    process.env.CLOUDINARY_API_KEY = "123456789";
    process.env.CLOUDINARY_API_SECRET = "secret-token-abcdef";

    const publicId = "job-tracker/tailored-cvs/Tailored_CV_Smith_12345";
    const signedUrl = generateSignedDownloadUrl(publicId, {
        resourceType: "raw",
        format: "pdf",
        expiresInSeconds: 300
    });

    assert.ok(signedUrl, "Signed URL must be generated");
    assert.ok(signedUrl.includes("demo-cloud"), "Must include Cloudinary cloud name");
    assert.ok(signedUrl.includes("type=authenticated"), "Must enforce type=authenticated");
    assert.ok(signedUrl.includes("expires_at="), "Must include expires_at parameter");
    assert.ok(signedUrl.includes("signature="), "Must include HMAC signature");
    assert.ok(signedUrl.includes("api_key=123456789"), "Must include Cloudinary API key");
});

test("Mongoose Models: CV schema includes resource_type and type default fields", () => {
    const cvSchemaPaths = CV.schema.paths;
    assert.ok(cvSchemaPaths.resource_type, "CV schema must define resource_type");
    assert.strictEqual(cvSchemaPaths.resource_type.defaultValue, "raw");
    assert.ok(cvSchemaPaths.type, "CV schema must define type");
    assert.strictEqual(cvSchemaPaths.type.defaultValue, "authenticated");
    assert.ok(cvSchemaPaths.publicId, "CV schema must define publicId");
});

test("Mongoose Models: TailoredCV schema includes publicId, resource_type and type fields", () => {
    const tailoredSchemaPaths = TailoredCV.schema.paths;
    assert.ok(tailoredSchemaPaths.publicId, "TailoredCV schema must define publicId");
    assert.ok(tailoredSchemaPaths.resource_type, "TailoredCV schema must define resource_type");
    assert.strictEqual(tailoredSchemaPaths.resource_type.defaultValue, "raw");
    assert.ok(tailoredSchemaPaths.type, "TailoredCV schema must define type");
    assert.strictEqual(tailoredSchemaPaths.type.defaultValue, "authenticated");
});

test("Cloudinary Configuration: detects configured state correctly", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "my_cloud";
    process.env.CLOUDINARY_API_KEY = "my_key";
    process.env.CLOUDINARY_API_SECRET = "my_secret";

    assert.strictEqual(isCloudinaryConfigured(), true);

    process.env.CLOUDINARY_CLOUD_NAME = "your_cloudinary_cloud_name";
    assert.strictEqual(isCloudinaryConfigured(), false);
});
