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
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} [folder="job-tracker/cvs"] - Target folder
 * @returns {Promise<{ publicId: string, secureUrl: string, format: string, bytes: number }>}
 */
export const uploadBufferToCloudinary = async (buffer, originalName, folder = "job-tracker/cvs") => {
    initCloudinary();

    if (!isCloudinaryConfigured()) {
        throw new Error(
            "Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env."
        );
    }

    const ext = path.extname(originalName).replace(".", "").toLowerCase() || "pdf";
    const cleanBaseName = path.parse(originalName).name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `${cleanBaseName}-${Date.now()}`;

    // PDFs and DOCX are best handled as 'raw' or 'auto'
    const resourceType = ext === "pdf" ? "auto" : "raw";

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                public_id: publicId,
                resource_type: resourceType,
                format: ext
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(new Error(`Cloudinary upload failed: ${error.message}`));
                }

                resolve({
                    publicId: result.public_id,
                    secureUrl: result.secure_url,
                    format: result.format || ext,
                    bytes: result.bytes || buffer.length
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
 * Deletes an asset from Cloudinary by public ID.
 *
 * @param {string} publicId - Cloudinary asset public ID
 * @param {string} [resourceType="raw"] - Cloudinary resource type ('raw', 'image', 'video')
 * @returns {Promise<any>}
 */
export const deleteCloudinaryAsset = async (publicId, resourceType = "raw") => {
    initCloudinary();

    if (!isCloudinaryConfigured()) {
        console.warn("Cloudinary not configured; skipping remote asset deletion:", publicId);
        return { result: "skipped_unconfigured" };
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        // Also try with auto/image if raw didn't find it
        if (result.result === "not found" && resourceType === "raw") {
            return await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        }
        return result;
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw new Error(`Failed to delete asset from Cloudinary: ${error.message}`);
    }
};
