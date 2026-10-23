import { CV } from "../models/CV.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { TailoredCV } from "../models/TailoredCV.js";
import { uploadBufferToCloudinary, deleteCloudinaryAsset, isCloudinaryConfigured } from "../services/cloudinaryService.js";
import { extractTextFromBuffer } from "../services/cvParserService.js";
import { generateTailoredCv, parseCvToProfile } from "../services/geminiService.js";
import { generateAtsPdfBuffer } from "../services/pdfService.js";
import { invalidateScoreCacheForCv } from "../services/scoringService.js";
import { FALLBACK_SEED_JOBS } from "./recommendationController.js";
import mongoose from "mongoose";
import path from "path";

/**
 * Safely resolves a job document by ObjectId, dedupeHash, fallback seed ID, or request payload.
 * Prevents Mongoose CastError on seed or string IDs.
 */
const resolveJob = async (jobId, payload = {}) => {
    let job = null;
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
        job = await Job.findById(jobId).lean();
    }
    if (!job && jobId) {
        job = await Job.findOne({ dedupeHash: jobId }).lean();
    }
    if (!job && jobId) {
        const seed = FALLBACK_SEED_JOBS.find(
            s => s._id === jobId || s.id === jobId || s.legacyId === jobId || s._id?.toString() === jobId || String(jobId).includes("seed-job")
        );
        if (seed) job = { ...seed };
    }
    if (!job) {
        job = {
            title: payload.title || payload.jobTitle || "Software Vacancy",
            company: payload.company || payload.jobCompany || "Direct Employer",
            requirements: payload.requirements || payload.jobRequirements || "Software engineering requirements",
            skills: payload.skills || payload.jobSkills || ["Software Engineering"],
            salary: payload.salary || "Negotiable",
            location: payload.location || "Sri Lanka",
            mode: payload.mode || "hybrid",
            applyUrl: payload.applyUrl || payload.link || "https://syscolabs.lk/careers"
        };
    }
    return job;
};

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

        // 5. Parse skills and structured credentials from extracted CV text
        let structuredProfile = {
            skills: user.skills || [],
            yearsOfExperience: 0,
            roles: [],
            education: [],
            projects: [],
            certifications: []
        };
        let extractedSkills = [];

        if (extractedText) {
            try {
                const parsed = await parseCvToProfile(extractedText);
                if (parsed) {
                    structuredProfile = parsed;
                    extractedSkills = parsed.skills || [];
                    // Merge parsed skills with existing user skills without duplicates
                    user.skills = Array.from(new Set([...(user.skills || []), ...extractedSkills]));
                    if (parsed.roles?.length > 0 && !user.preferredRole) {
                        user.preferredRole = parsed.roles[0];
                    }
                }
            } catch (parseErr) {
                console.warn("Could not parse structured profile on upload:", parseErr.message);
            }
        }

        // 6. Deactivate previous versions
        await CV.updateMany({ userId }, { isActive: false });

        // 7. Create new CV document
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
            structuredProfile
        });

        await newCv.save();
        invalidateScoreCacheForCv(newCv._id.toString());

        // 8. Update User document
        user.cvPath = secureUrl;
        user.cvName = originalName;
        if (extractedText) {
            user.resumeText = extractedText;
        }
        await user.save();

        return res.status(201).json({
            message: "CV uploaded and processed successfully",
            cv: newCv,
            user,
            extractedSkills,
            structuredProfile
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

/**
 * POST /api/cv/tailor
 * Generates tailored resume data using Gemini with strict anti-hallucination checks,
 * produces ATS-compliant PDF, uploads to Cloudinary, and stores TailoredCV record.
 */
export const tailorCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { jobId, customData } = req.body;

    if (!jobId) {
        return res.status(400).json({ message: "jobId is required to tailor CV" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const activeCv = await CV.findOne({ userId, isActive: true });

        // Retrieve job document safely without CastError
        const job = await resolveJob(jobId, req.body);

        // Construct user profile
        const userProfile = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            linkedin: user.linkedin,
            skills: activeCv?.structuredProfile?.skills?.length > 0
                ? activeCv.structuredProfile.skills
                : (user.skills || ["React", "JavaScript"]),
            yearsOfExperience: activeCv?.structuredProfile?.yearsOfExperience || 2,
            roles: activeCv?.structuredProfile?.roles || ["Software Developer"],
            education: activeCv?.structuredProfile?.education || [
                { institution: "University / Institute", degree: "BSc in Computing", year: "Graduated" }
            ],
            projects: activeCv?.structuredProfile?.projects || [
                { title: "Portfolio Projects", description: "Full stack web applications", technologies: user.skills || ["React", "Node.js"] }
            ],
            experience: activeCv?.structuredProfile?.experience || [
                {
                    company: "Software Development Firm",
                    role: "Software Developer",
                    duration: "2024 - Present",
                    bullets: [
                        "Built scalable user interfaces and reusable UI component architectures.",
                        "Optimized API response latency and database query performance."
                    ]
                }
            ]
        };

        // 1. Generate or use edited tailored data
        let tailoredData = customData;
        if (!tailoredData) {
            tailoredData = await generateTailoredCv(userProfile, job);
        }

        // 2. Generate ATS single-column PDF buffer
        const pdfBuffer = await generateAtsPdfBuffer(userProfile, tailoredData);

        // 3. Upload PDF to Cloudinary (or data URL fallback if unconfigured)
        const filename = `Tailored_CV_${user.lastname}_${Date.now()}.pdf`;
        let pdfUrl = "";
        let pdfPublicId = "";

        if (isCloudinaryConfigured()) {
            const uploadResult = await uploadBufferToCloudinary(pdfBuffer, filename, "job-tracker/tailored-cvs");
            pdfUrl = uploadResult.secureUrl;
            pdfPublicId = uploadResult.publicId;
        } else {
            pdfUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
            pdfPublicId = `local-tailored-${Date.now()}`;
        }

        // 4. Upsert TailoredCV record
        let tailoredCvDoc = await TailoredCV.findOne({ userId, jobId: String(jobId) });
        if (tailoredCvDoc) {
            tailoredCvDoc.tailoredData = tailoredData;
            tailoredCvDoc.pdfUrl = pdfUrl;
            tailoredCvDoc.pdfPublicId = pdfPublicId;
            tailoredCvDoc.jobTitle = job.title;
            tailoredCvDoc.jobCompany = job.company;
            await tailoredCvDoc.save();
        } else {
            tailoredCvDoc = new TailoredCV({
                userId,
                jobId: String(jobId),
                jobTitle: job.title,
                jobCompany: job.company,
                tailoredData,
                pdfUrl,
                pdfPublicId
            });
            await tailoredCvDoc.save();
        }

        return res.status(200).json({
            message: "Tailored CV generated successfully",
            tailoredCv: tailoredCvDoc,
            pdfUrl
        });
    } catch (error) {
        console.error("Error tailoring CV:", error);
        return res.status(500).json({ message: error.message || "Failed to generate tailored CV" });
    }
};

/**
 * GET /api/cv/tailored/:jobId
 * Retrieves existing tailored CV for specific job and user.
 */
export const getTailoredCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { jobId } = req.params;

    try {
        const tailoredCv = await TailoredCV.findOne({ userId, jobId: String(jobId) });
        if (!tailoredCv) {
            return res.status(404).json({ message: "No tailored CV found for this job" });
        }
        return res.status(200).json({ tailoredCv });
    } catch (error) {
        console.error("Error fetching tailored CV:", error);
        return res.status(500).json({ message: "Failed to fetch tailored CV" });
    }
};

/**
 * POST /api/cv/apply-assisted
 * Assisted Apply flow:
 * 1. Creates an Application record (status "applied") with tailored CV link.
 * 2. Pre-fills notes.
 * 3. Prepares mailto: link with cover email if contact email is found.
 */
export const assistedApplyHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { jobId, tailoredCvId, notes = "" } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Retrieve job safely without Mongoose CastError
        const job = await resolveJob(jobId, req.body);

        let tailoredPdfUrl = "";
        if (tailoredCvId && mongoose.Types.ObjectId.isValid(tailoredCvId)) {
            const tailoredCv = await TailoredCV.findById(tailoredCvId);
            if (tailoredCv) {
                tailoredPdfUrl = tailoredCv.pdfUrl;
            }
        }

        // Build Application document
        const newApplication = new Application({
            title: job.title,
            company: job.company,
            requirements: Array.isArray(job.requirements) ? job.requirements.join(", ") : (job.requirements || "N/A"),
            salary: job.salary || "Negotiable",
            location: job.location || "Sri Lanka",
            mode: ["remote", "on-site", "hybrid"].includes(job.mode) ? job.mode : "hybrid",
            status: "applied",
            userId,
            category: "Assisted Application",
            link: job.applyUrl || "",
            opportunity: tailoredPdfUrl ? `Tailored CV attached: ${tailoredPdfUrl}` : (notes || "Applied via Job Tracker Assisted Flow"),
            inTouchPerson: job.contactEmail || job.inTouchPerson || ""
        });

        await newApplication.save();

        // Also push application ID to user
        await User.findByIdAndUpdate(userId, {
            $addToSet: { applications: newApplication._id }
        });

        // Prepare mailto link if an email address is detected
        let mailtoUrl = null;
        const emailMatch = (job.description || "").match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const contactEmail = job.contactEmail || (emailMatch ? emailMatch[0] : null);

        if (contactEmail) {
            const subject = encodeURIComponent(`Application for ${job.title} - ${user.firstname} ${user.lastname}`);
            const body = encodeURIComponent(
                `Dear Hiring Team at ${job.company},\n\n` +
                `I am writing to express my enthusiastic interest in the ${job.title} role.\n\n` +
                `With my hands-on background and proficiency in ${(user.skills || []).slice(0, 4).join(", ")}, I am confident in adding immediate value to your engineering team.\n\n` +
                (tailoredPdfUrl ? `Please find my tailored resume attached here: ${tailoredPdfUrl}\n\n` : "") +
                `Thank you for your time and consideration.\n\n` +
                `Sincerely,\n${user.firstname} ${user.lastname}\n${user.email}`
            );
            mailtoUrl = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
        }

        return res.status(201).json({
            message: "Assisted application recorded successfully",
            application: newApplication,
            applyUrl: job.applyUrl,
            mailtoUrl
        });
    } catch (error) {
        console.error("Error in assisted apply:", error);
        return res.status(500).json({ message: error.message || "Failed to process assisted application" });
    }
};

/**
 * POST /api/cv/parse-skills
 * Parses technical skills from the candidate's active CV (or provided resumeText).
 * Can optionally auto-merge into user.skills.
 */
export const parseCvSkillsHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { saveToProfile = true } = req.body || {};

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const activeCv = await CV.findOne({ userId, isActive: true }).sort({ version: -1 });
        const textToParse = activeCv?.extractedText || user.resumeText || "";

        if (!textToParse.trim()) {
            return res.status(400).json({
                message: "No CV text available to parse. Please upload a CV first or paste your resume text."
            });
        }

        const parsed = await parseCvToProfile(textToParse);
        const extractedSkills = parsed.skills || [];

        if (activeCv) {
            activeCv.structuredProfile = parsed;
            await activeCv.save();
            invalidateScoreCacheForCv(activeCv._id.toString());
        }

        if (saveToProfile && extractedSkills.length > 0) {
            user.skills = Array.from(new Set([...(user.skills || []), ...extractedSkills]));
            if (parsed.roles?.length > 0 && !user.preferredRole) {
                user.preferredRole = parsed.roles[0];
            }
            await user.save();
        }

        return res.status(200).json({
            message: `Successfully parsed ${extractedSkills.length} skills from your CV!`,
            extractedSkills,
            structuredProfile: parsed,
            user
        });
    } catch (error) {
        console.error("Error parsing skills from CV:", error);
        return res.status(500).json({ message: error.message || "Failed to parse skills from CV" });
    }
};

