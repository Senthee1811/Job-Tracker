import { CV } from "../models/CV.js";
import { User } from "../models/User.js";
import { uploadBufferToCloudinary, deleteCloudinaryAsset, isCloudinaryConfigured } from "../services/cloudinaryService.js";
import { extractTextFromBuffer } from "../services/cvParserService.js";
import path from "path";

/**
 * Handles CV Upload:
 * 1. Validates file size (max 5MB) and mimetype (PDF/DOCX/TXT).
 * 2. Extracts plain text from the file buffer using pdf-parse/mammoth.
 * 3. Streams file buffer to Cloudinary (or local fallback if unconfigured in dev).
 * 4. Determines the next version number for this user.
 * 5. Sets all previous CVs for this user to isActive = false.
 * 6. Creates a new CV record with isActive = true.
 * 7. Updates User.cvPath, User.cvName, and User.resumeText for backward compatibility.
 */
export const uploadCVHandler = async (req, res) => {
    const userId = req.user?.userId;

    try {
        if (!req.file) {
            return res.status(400).json({ message: "No CV file provided for upload" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const file = req.file;
        const originalName = file.originalname || "resume.pdf";
        const ext = path.extname(originalName).toLowerCase();

        // 1. Validate file extension and size
        const allowedExts = [".pdf", ".docx", ".txt"];
        if (!allowedExts.includes(ext)) {
            return res.status(400).json({
                message: `Unsupported file type: ${ext}. Please upload a PDF or DOCX file (under 5MB).`
            });
        }

        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: "File exceeds maximum size limit of 5MB" });
        }

        // 2. Extract text from buffer
        let extractedText = "";
        try {
            extractedText = await extractTextFromBuffer(file.buffer, originalName, file.mimetype);
        } catch (extractErr) {
            console.warn("Text extraction warning:", extractErr.message);
            extractedText = "";
        }

        // 3. Upload to Cloudinary (or provide local URL if Cloudinary not yet configured)
        let publicId = `local-cv-${userId}-${Date.now()}`;
        let secureUrl = "";
        let bytes = file.size;
        let format = ext.replace(".", "");

        if (isCloudinaryConfigured()) {
            const uploadResult = await uploadBufferToCloudinary(file.buffer, originalName);
            publicId = uploadResult.publicId;
            secureUrl = uploadResult.secureUrl;
            bytes = uploadResult.bytes;
            format = uploadResult.format;
        } else {
            // Unconfigured warning placeholder for development
            secureUrl = `https://res.cloudinary.com/demo/raw/upload/${publicId}.${format}`;
            console.warn(
                "Warning: Cloudinary credentials not provided in backend/.env. Using placeholder asset reference."
            );
        }

        // 4. Determine next version number
        const latestCv = await CV.findOne({ userId }).sort({ version: -1 });
        const nextVersion = latestCv ? latestCv.version + 1 : 1;

        // 5. Deactivate previous versions
        await CV.updateMany({ userId }, { isActive: false });

        // 6. Create new CV document
        const newCv = new CV({
            userId,
            publicId,
            secureUrl,
            originalName,
            format,
            bytes,
            version: nextVersion,
            isActive: true,
            extractedText,
            structuredProfile: {
                skills: user.skills || [],
                yearsOfExperience: 0,
                roles: [],
                education: [],
                projects: [],
                certifications: []
            }
        });

        await newCv.save();

        // 7. Update User document for backward compatibility
        user.cvPath = secureUrl;
        user.cvName = originalName;
        if (extractedText) {
            user.resumeText = extractedText;
        }
        await user.save();

        return res.status(201).json({
            message: "CV uploaded and processed successfully",
            cv: newCv,
            user
        });
    } catch (error) {
        console.error("CV Upload Controller Error:", error);
        return res.status(500).json({ message: error.message || "Failed to upload and parse CV" });
    }
};

/**
 * Fetch all CV versions for the authenticated user.
 */
export const getCvHistory = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const cvs = await CV.find({ userId }).sort({ version: -1 });
        return res.status(200).json({ cvs });
    } catch (error) {
        console.error("Error fetching CV history:", error);
        return res.status(500).json({ message: "Failed to fetch CV versions" });
    }
};

/**
 * Fetch active CV for authenticated user.
 */
export const getActiveCv = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const cv = await CV.findOne({ userId, isActive: true });
        if (!cv) {
            return res.status(404).json({ message: "No active CV found for user" });
        }
        return res.status(200).json({ cv });
    } catch (error) {
        console.error("Error fetching active CV:", error);
        return res.status(500).json({ message: "Failed to fetch active CV" });
    }
};

/**
 * Delete a CV version and remove its Cloudinary asset.
 */
export const deleteCvVersion = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const cv = await CV.findOne({ _id: id, userId });
        if (!cv) {
            return res.status(404).json({ message: "CV document not found" });
        }

        // Delete from Cloudinary
        if (cv.publicId && !cv.publicId.startsWith("local-cv-")) {
            try {
                await deleteCloudinaryAsset(cv.publicId, cv.format === "pdf" ? "auto" : "raw");
            } catch (cloudErr) {
                console.warn("Could not delete from Cloudinary:", cloudErr.message);
            }
        }

        const wasActive = cv.isActive;
        await CV.deleteOne({ _id: id });

        // If the deleted CV was active, promote the most recent remaining CV
        if (wasActive) {
            const remainingLatest = await CV.findOne({ userId }).sort({ version: -1 });
            if (remainingLatest) {
                remainingLatest.isActive = true;
                await remainingLatest.save();

                await User.findByIdAndUpdate(userId, {
                    cvPath: remainingLatest.secureUrl,
                    cvName: remainingLatest.originalName,
                    resumeText: remainingLatest.extractedText
                });
            } else {
                await User.findByIdAndUpdate(userId, {
                    cvPath: "",
                    cvName: ""
                });
            }
        }

        return res.status(200).json({ message: "CV version deleted successfully" });
    } catch (error) {
        console.error("Error deleting CV version:", error);
        return res.status(500).json({ message: "Failed to delete CV version" });
    }
};
