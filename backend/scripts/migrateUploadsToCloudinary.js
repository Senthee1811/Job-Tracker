import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { User } from "../models/User.js";
import { CV } from "../models/CV.js";
import { uploadBufferToCloudinary, isCloudinaryConfigured } from "../services/cloudinaryService.js";
import { extractTextFromBuffer } from "../services/cvParserService.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const migrate = async () => {
    console.log("=== Starting Uploads to Cloudinary Migration ===");

    if (!process.env.MONGODB_URI) {
        console.error("Error: MONGODB_URI not found in environment.");
        process.exit(1);
    }

    if (!isCloudinaryConfigured()) {
        console.warn(
            "Warning: Cloudinary credentials are not configured in .env.\n" +
            "Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before running this migration."
        );
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const usersWithLocalCv = await User.find({
            cvPath: { $regex: /^uploads[\\\/]/i }
        });

        console.log(`Found ${usersWithLocalCv.length} user(s) with local CV files in ./uploads.`);

        for (const user of usersWithLocalCv) {
            const localFilePath = path.resolve(process.cwd(), user.cvPath);
            if (!fs.existsSync(localFilePath)) {
                console.warn(`File not found on disk for user ${user._id}: ${localFilePath}`);
                continue;
            }

            console.log(`Processing file for ${user.email}: ${localFilePath}`);
            const buffer = fs.readFileSync(localFilePath);
            const originalName = user.cvName || path.basename(localFilePath);

            // 1. Extract text
            let extractedText = "";
            try {
                extractedText = await extractTextFromBuffer(buffer, originalName);
            } catch (err) {
                console.warn(`Text extraction error for ${originalName}:`, err.message);
            }

            // 2. Upload to Cloudinary
            const cloudResult = await uploadBufferToCloudinary(buffer, originalName);
            console.log(`Uploaded to Cloudinary: ${cloudResult.secureUrl}`);

            // 3. Create CV document
            const cvDoc = new CV({
                userId: user._id,
                publicId: cloudResult.publicId,
                secureUrl: cloudResult.secureUrl,
                originalName,
                format: cloudResult.format,
                bytes: cloudResult.bytes,
                version: 1,
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

            await cvDoc.save();

            // 4. Update user record
            user.cvPath = cloudResult.secureUrl;
            if (extractedText) {
                user.resumeText = extractedText;
            }
            await user.save();
            console.log(`Updated user ${user.email} with new Cloudinary CV URL.`);
        }

        console.log("=== Migration Completed Successfully. Local files in ./uploads were kept for verification. ===");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
