import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import path from "path";

// Initialize Cloudinary
const initCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
};

/**
 * Checks if real Cloudinary credentials have been configured.
 * @returns {boolean}
 */
export const isCloudinaryConfigured = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    return !!(
        cloudName &&
        apiKey &&
        apiSecret &&
        !cloudName.includes("your_cloudinary") &&
        !apiKey.includes("your_cloudinary")
    );
};

/**
 * Uploads a file buffer to Cloudinary using upload_stream.
 * PDFs and documents are uploaded with resource_type: "raw" and type: "authenticated"
 * to protect candidate privacy and prevent 401 ACL failure errors.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} [folder="job-tracker/cvs"] - Target folder
 * @param {object} [options={}] - Custom upload options override
 * @returns {Promise<{ publicId: string, secureUrl: string, format: string, bytes: number, resourceType: string, type: string }>}
 */
export const uploadBufferToCloudinary = async (
    buffer,
    originalName,
    folder = "job-tracker/cvs",
    options = {}
) => {
    initCloudinary();

    if (!isCloudinaryConfigured()) {
        throw new Error(
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env."
        );
    }

    const ext = path.extname(originalName).replace(".", "").toLowerCase() || "pdf";
    const cleanBaseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `${cleanBaseName}-${Date.now()}`;

    // PDFs and DOCX are uploaded with resource_type: "raw" and type: "authenticated"
    const resourceType = options.resource_type || "raw";
    const uploadType = options.type || "authenticated";
    const accessMode = options.access_mode || "authenticated";

    // Requirement 1: Log resource_type, type and access_mode used
    console.log(
        `[Cloudinary Upload Options] file: ${originalName}, resource_type: ${resourceType}, type: ${uploadType}, access_mode: ${accessMode}`
    );

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: resourceType,
                type: uploadType,
                access_mode: accessMode,
                format: ext
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                }

                console.log(
                    `[Cloudinary Upload Success] public_id: ${result.public_id}, resource_type: ${result.resource_type}, type: ${result.type}`
                );

                resolve({
                    publicId: result.public_id,
                    secureUrl: result.secure_url,
                    format: result.format || ext,
                    bytes: result.bytes || buffer.length,
                    resourceType: result.resource_type || resourceType,
                    type: result.type || uploadType
                });
            }
        );

        const readable = new Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
};

/**
 * Generates a short-lived (default 5 minutes) signed download URL for an authenticated asset.
 *
 * @param {string} publicId - Cloudinary asset public ID
 * @param {object} [options={}] - Options { resourceType, format, expiresInSeconds }
 * @returns {string} Signed short-lived URL
 */
export const generateSignedDownloadUrl = (
    publicId,
    { resourceType = "raw", format = "pdf", expiresInSeconds = 300 } = {}
) => {
    initCloudinary();

    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

    return cloudinary.utils.private_download_url(publicId, format, {
        resource_type: resourceType,
        type: "authenticated",
        expires_at: expiresAt
    });
};

/**
 * Deletes an asset from Cloudinary by public ID.
 *
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} [resourceType="raw"] - Cloudinary resource type ('raw', 'image', 'video')
 * @param {string} [type="authenticated"] - Cloudinary delivery type ('authenticated', 'upload')
 * @returns {Promise<any>}
 */
export const deleteCloudinaryAsset = async (publicId, resourceType = "raw", type = "authenticated") => {
    initCloudinary();

    if (!isCloudinaryConfigured()) {
        console.warn("Cloudinary not configured; skipping remote asset deletion:", publicId);
        return { result: "skipped_unconfigured" };
    }

    try {
        let result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type });
        if (result.result === "not found") {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: "image", type });
        }
        if (result.result === "not found") {
            result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: "upload" });
        }
        return result;
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new Error(`Failed to delete asset from Cloudinary: ${error.message}`);
    }
};
