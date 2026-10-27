import { CV } from "../models/CV.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";
import { Application } from "../models/Application.js";
import { TailoredCV } from "../models/TailoredCV.js";
import {
    uploadBufferToCloudinary,
    deleteCloudinaryAsset,
    isCloudinaryConfigured,
    generateSignedDownloadUrl
} from "../services/cloudinaryService.js";
import { extractTextFromBuffer } from "../services/cvParserService.js";
import {
    generateTailoredCv,
    generateCvPatch,
    parseCvToProfile,
    analyzeCvDetailed
} from "../services/geminiService.js";
import {
    generateAtsPdfBuffer,
    generateCvAnalysisPdfBuffer,
    generateDocumentModelPdfBuffer
} from "../services/pdfService.js";
import {
    parseCvToDocumentModel,
    applyEditsToDocumentModel,
    applyEditsToDocxBuffer
} from "../services/documentModelService.js";
import { validatePatchEdits } from "../services/patchValidationService.js";
import { invalidateScoreCacheForCv } from "../services/scoringService.js";
import { FALLBACK_SEED_JOBS } from "./recommendationController.js";
import { renderLatexResume, renderLatexFromDocumentModel } from "../lib/latexUtils.js";
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

        // 3. Upload to Cloudinary with authenticated raw resource type
        let publicId = `local-cv-${userId}-${Date.now()}`;
        let bytes = file.size;
        let format = ext.replace(".", "");
        let resourceType = "raw";
        let uploadType = "authenticated";

        if (isCloudinaryConfigured()) {
            const uploadResult = await uploadBufferToCloudinary(file.buffer, originalName, "job-tracker/cvs", {
                resource_type: "raw",
                type: "authenticated",
                access_mode: "authenticated"
            });
            publicId = uploadResult.publicId;
            bytes = uploadResult.bytes;
            format = uploadResult.format;
            resourceType = uploadResult.resourceType || "raw";
            uploadType = uploadResult.type || "authenticated";
        } else {
            console.warn(
                "Warning: Cloudinary credentials not provided in backend/.env. Using local asset reference."
            );
        }

        // 4. Determine next version number
        const latestCv = await CV.findOne({ userId }).sort({ version: -1 });
        const nextVersion = latestCv ? latestCv.version + 1 : 1;

        // 5. Parse DocumentModel (preserving exact section order, headings, styleHints, and blocks)
        const documentModel = parseCvToDocumentModel(extractedText, originalName, file.buffer);

        // 6. Parse skills and structured credentials from extracted CV text
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

        // 7. Deactivate previous versions
        await CV.updateMany({ userId }, { isActive: false });

        // 8. Create new CV document with internal authenticated endpoint instead of raw Cloudinary URL
        const newCv = new CV({
            userId,
            publicId,
            resource_type: resourceType,
            type: uploadType,
            secureUrl: "/api/cv/download/pending",
            originalName,
            format,
            bytes,
            version: nextVersion,
            isActive: true,
            extractedText,
            documentModel,
            structuredProfile
        });

        newCv.secureUrl = `/api/cv/download/${newCv._id}`;
        await newCv.save();
        invalidateScoreCacheForCv(newCv._id.toString());

        // 9. Update User document with internal authenticated download path
        user.cvPath = `/api/cv/download/${newCv._id}`;
        user.cvName = originalName;
        if (extractedText) {
            user.resumeText = extractedText;
        }
        await user.save();

        return res.status(201).json({
            message: "CV uploaded and processed successfully",
            cv: newCv,
            documentModel,
            completenessCheck: documentModel.completenessCheck,
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
 * Fetch all CV versions for the authenticated user with internal authenticated download paths.
 */
export const getCvHistory = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const cvs = await CV.find({ userId }).sort({ version: -1 }).lean();
        const sanitizedCvs = cvs.map(cv => ({
            ...cv,
            secureUrl: `/api/cv/download/${cv._id}`
        }));
        return res.status(200).json({ cvs: sanitizedCvs });
    } catch (error) {
        console.error("Error fetching CV history:", error);
        return res.status(500).json({ message: "Failed to fetch CV versions" });
    }
};

/**
 * Fetch active CV for authenticated user with internal authenticated download path.
 */
export const getActiveCv = async (req, res) => {
    const userId = req.user?.userId;

    try {
        const cv = await CV.findOne({ userId, isActive: true }).lean();
        if (!cv) {
            return res.status(404).json({ message: "No active CV found for user" });
        }
        cv.secureUrl = `/api/cv/download/${cv._id}`;
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
                await deleteCloudinaryAsset(cv.publicId, cv.resource_type || "raw", cv.type || "authenticated");
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
                    cvPath: `/api/cv/download/${remainingLatest._id}`,
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

        // 1. Obtain original DocumentModel
        let originalModel = activeCv?.documentModel;
        if (!originalModel || !originalModel.sections || originalModel.sections.length === 0) {
            originalModel = parseCvToDocumentModel(
                activeCv?.extractedText || user.resumeText || "",
                activeCv?.originalName || "resume.pdf"
            );
            if (activeCv) {
                activeCv.documentModel = originalModel;
                await activeCv.save();
            }
        }

        // 2. Generate or use submitted patch edits
        let patch = req.body.customEdits || customData;
        if (!patch) {
            patch = await generateCvPatch(originalModel, job, {
                onlyReorderSkills: req.body.onlyReorderSkills === true
            });
        }

        // 3. Validate patch server-side (enforce protected fields, rewording threshold, no fabricated entities)
        const validation = validatePatchEdits(patch, originalModel);
        const validatedPatch = validation.validatedPatch;

        // 4. Apply validated edits to generate tailored DocumentModel
        const { originalModel: orig, tailoredModel } = applyEditsToDocumentModel(originalModel, validatedPatch);

        // 5. Generate PDF buffer directly from tailored DocumentModel (preserving original section order, headings, styleHints)
        const pdfBuffer = await generateDocumentModelPdfBuffer(tailoredModel);

        // 6. Upload PDF to Cloudinary with authenticated raw resource type
        const safeCandidateName = (user.lastname || "Candidate").replace(/[^a-zA-Z0-9]/g, "");
        const filename = `Tailored_CV_${safeCandidateName}_${Date.now()}.pdf`;
        let pdfPublicId = "";
        let resourceType = "raw";
        let uploadType = "authenticated";

        if (isCloudinaryConfigured()) {
            const uploadResult = await uploadBufferToCloudinary(pdfBuffer, filename, "job-tracker/tailored-cvs", {
                resource_type: "raw",
                type: "authenticated",
                access_mode: "authenticated"
            });
            pdfPublicId = uploadResult.publicId;
            resourceType = uploadResult.resourceType || "raw";
            uploadType = uploadResult.type || "authenticated";
        } else {
            pdfPublicId = `local-tailored-${Date.now()}`;
        }

        // 7. Generate compilable LaTeX source directly from the candidate's tailored DocumentModel
        const texSource = renderLatexFromDocumentModel(tailoredModel);

        // 8. Upsert TailoredCV record
        let tailoredCvDoc = await TailoredCV.findOne({ userId, jobId: String(jobId) });
        if (!tailoredCvDoc) {
            tailoredCvDoc = new TailoredCV({
                userId,
                jobId: String(jobId)
            });
        }
        tailoredCvDoc.originalDocumentModel = orig;
        tailoredCvDoc.tailoredDocumentModel = tailoredModel;
        tailoredCvDoc.appliedEdits = validatedPatch;
        tailoredCvDoc.tailoredData = tailoredModel; // for backward compatibility
        tailoredCvDoc.publicId = pdfPublicId;
        tailoredCvDoc.pdfPublicId = pdfPublicId;
        tailoredCvDoc.resource_type = resourceType;
        tailoredCvDoc.type = uploadType;
        tailoredCvDoc.jobTitle = job.title;
        tailoredCvDoc.jobCompany = job.company;
        tailoredCvDoc.texSource = texSource;
        tailoredCvDoc.hasDocx = activeCv?.format === "docx";
        tailoredCvDoc.pdfUrl = `/api/cv/tailored/${tailoredCvDoc._id}/pdf`;
        tailoredCvDoc.docxUrl = `/api/cv/tailored/${tailoredCvDoc._id}/docx`;
        await tailoredCvDoc.save();

        return res.status(200).json({
            message: "Tailored CV generated successfully",
            tailoredCv: tailoredCvDoc,
            originalDocumentModel: orig,
            tailoredDocumentModel: tailoredModel,
            appliedEdits: validatedPatch,
            pdfUrl: `/api/cv/tailored/${tailoredCvDoc._id}/pdf`,
            docxUrl: `/api/cv/tailored/${tailoredCvDoc._id}/docx`,
            hasDocx: activeCv?.format === "docx",
            texSource,
            warnings: validation.warnings
        });
    } catch (error) {
        console.error("Error tailoring CV:", error);
        return res.status(500).json({ message: error.message || "Failed to generate tailored CV" });
    }
};

/**
 * GET /api/cv/tailored/:jobId
 * Retrieves existing tailored CV for specific job and user with internal authenticated endpoint.
 */
export const getTailoredCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { jobId } = req.params;

    try {
        const tailoredCv = await TailoredCV.findOne({ userId, jobId: String(jobId) });
        if (!tailoredCv) {
            return res.status(404).json({ message: "No tailored CV found for this job" });
        }
        tailoredCv.pdfUrl = `/api/cv/tailored/${tailoredCv._id}/pdf`;
        tailoredCv.docxUrl = `/api/cv/tailored/${tailoredCv._id}/docx`;
        return res.status(200).json({
            tailoredCv,
            originalDocumentModel: tailoredCv.originalDocumentModel,
            tailoredDocumentModel: tailoredCv.tailoredDocumentModel,
            appliedEdits: tailoredCv.appliedEdits,
            hasDocx: tailoredCv.hasDocx
        });
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

/**
 * POST /api/cv/analyze
 * Comprehensive AI CV audit & scoring.
 * Saves analysisReport on the CV document and returns the report.
 */
export const analyzeCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { cvId } = req.body || {};

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let cv = null;
        if (cvId && mongoose.Types.ObjectId.isValid(cvId)) {
            cv = await CV.findOne({ _id: cvId, userId });
        }
        if (!cv) {
            cv = await CV.findOne({ userId, isActive: true }).sort({ version: -1 });
        }

        const textToAnalyze = cv?.extractedText || user.resumeText || "";
        if (!textToAnalyze.trim()) {
            return res.status(400).json({
                message: "No CV text available to analyze. Please upload your CV first."
            });
        }

        const report = await analyzeCvDetailed(textToAnalyze, cv?.structuredProfile || {
            skills: user.skills || [],
            roles: user.preferences?.roles || ["Software Engineer"]
        });

        report.analyzedAt = new Date();

        if (cv) {
            cv.analysisReport = report;
            await cv.save();
        }

        return res.status(200).json({
            message: "CV analysis completed successfully",
            analysisReport: report,
            cvId: cv?._id
        });
    } catch (error) {
        console.error("Error analyzing CV:", error);
        return res.status(500).json({ message: error.message || "Failed to analyze CV" });
    }
};

/**
 * GET /api/cv/analysis/:id/report.pdf
 * Generates and downloads branded PDF report of the CV audit.
 */
export const downloadAnalysisPdfHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let cv = null;
        if (id && id !== "active" && mongoose.Types.ObjectId.isValid(id)) {
            cv = await CV.findOne({ _id: id, userId });
        }
        if (!cv) {
            cv = await CV.findOne({ userId, isActive: true }).sort({ version: -1 });
        }

        if (!cv) {
            return res.status(404).json({ message: "CV document not found" });
        }

        let report = cv.analysisReport;
        if (!report || !report.overallScore) {
            // Compute on the fly if not yet analyzed
            report = await analyzeCvDetailed(cv.extractedText || user.resumeText || "", cv.structuredProfile || {});
            report.analyzedAt = new Date();
            cv.analysisReport = report;
            await cv.save();
        }

        const pdfBuffer = await generateCvAnalysisPdfBuffer(user, cv, report);
        const safeDate = new Date().toISOString().split("T")[0];
        const filename = `CV-Analysis-${user.lastname || "Report"}-${safeDate}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("Error generating analysis PDF:", error);
        return res.status(500).json({ message: error.message || "Failed to generate analysis PDF" });
    }
};

/**
 * GET /api/cv/tailored/:id/pdf
 * Authenticated download/stream of compiled tailored PDF resume.
 * Requires JWT, verifies document belongs to user.
 * Generates short-lived signed URL (about 5 minutes) with Cloudinary SDK, or streams the file
 * with Content-Disposition: attachment (or inline if ?inline=true).
 */
export const downloadTailoredPdfHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let tailoredCv = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            tailoredCv = await TailoredCV.findOne({ _id: id, userId });
        }
        if (!tailoredCv) {
            tailoredCv = await TailoredCV.findOne({ jobId: String(id), userId });
        }

        if (!tailoredCv) {
            return res.status(404).json({ message: "Tailored CV document not found or access denied" });
        }

        const isInline = req.query.inline === "true";
        const disposition = isInline ? "inline" : "attachment";
        const safeCandidate = (user.lastname || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "");
        const safeCompany = (tailoredCv.jobCompany || "Tailored").replace(/[^a-zA-Z0-9_-]/g, "");
        const filename = `${safeCandidate}-${safeCompany}-CV.pdf`;

        const assetPublicId = tailoredCv.publicId || tailoredCv.pdfPublicId;

        // If client specifically asks for the short-lived signed URL
        if (req.query.action === "url" && assetPublicId && !assetPublicId.startsWith("local-") && isCloudinaryConfigured()) {
            const signedUrl = generateSignedDownloadUrl(assetPublicId, {
                resourceType: tailoredCv.resource_type || "raw",
                format: "pdf",
                expiresInSeconds: 300
            });
            return res.status(200).json({ url: signedUrl, expiresInSeconds: 300 });
        }

        if (req.query.redirect === "true" && assetPublicId && !assetPublicId.startsWith("local-") && isCloudinaryConfigured()) {
            const signedUrl = generateSignedDownloadUrl(assetPublicId, {
                resourceType: tailoredCv.resource_type || "raw",
                format: "pdf",
                expiresInSeconds: 300
            });
            return res.redirect(signedUrl);
        }

        // Attempt streaming directly from Cloudinary using signed URL
        if (assetPublicId && !assetPublicId.startsWith("local-") && isCloudinaryConfigured()) {
            try {
                const signedUrl = generateSignedDownloadUrl(assetPublicId, {
                    resourceType: tailoredCv.resource_type || "raw",
                    format: "pdf",
                    expiresInSeconds: 300
                });
                const cloudRes = await fetch(signedUrl);
                if (cloudRes.ok) {
                    const arrayBuffer = await cloudRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
                    res.setHeader("Content-Length", buffer.length);
                    return res.status(200).send(buffer);
                } else {
                    console.warn(`Cloudinary download returned HTTP ${cloudRes.status}; falling back to ATS PDF generator.`);
                }
            } catch (cloudFetchErr) {
                console.warn("Could not fetch remote Cloudinary asset buffer; falling back to ATS PDF generator:", cloudFetchErr.message);
            }
        }

        // DocumentModel compilation fallback (preserves exact candidate section order and headings)
        let pdfBuffer;
        if (tailoredCv.tailoredDocumentModel?.sections) {
            pdfBuffer = await generateDocumentModelPdfBuffer(tailoredCv.tailoredDocumentModel);
        } else {
            const candidateProfile = {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                linkedin: user.linkedin,
                location: user.preferences?.locations?.[0] || "Sri Lanka"
            };
            pdfBuffer = await generateAtsPdfBuffer(candidateProfile, tailoredCv.tailoredData || {});
        }

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("Error downloading tailored PDF:", error);
        return res.status(500).json({ message: error.message || "Failed to download tailored PDF" });
    }
};

/**
 * GET /api/cv/tailored/:id/docx
 * Authenticated download of native in-place edited DOCX file.
 */
export const downloadTailoredDocxHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let tailoredCv = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            tailoredCv = await TailoredCV.findOne({ _id: id, userId });
        }
        if (!tailoredCv) {
            tailoredCv = await TailoredCV.findOne({ jobId: String(id), userId });
        }

        if (!tailoredCv) {
            return res.status(404).json({ message: "Tailored CV document not found or access denied" });
        }

        const activeCv = await CV.findOne({ userId, isActive: true });
        const safeCandidate = (user.lastname || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "");
        const safeCompany = (tailoredCv.jobCompany || "Tailored").replace(/[^a-zA-Z0-9_-]/g, "");
        const filename = `${safeCandidate}-${safeCompany}-CV.docx`;

        // If the candidate uploaded a DOCX, fetch original and apply in-place edits
        if (activeCv && activeCv.publicId && isCloudinaryConfigured()) {
            try {
                const signedUrl = generateSignedDownloadUrl(activeCv.publicId, {
                    resourceType: activeCv.resource_type || "raw",
                    format: "docx",
                    expiresInSeconds: 300
                });
                const cloudRes = await fetch(signedUrl);
                if (cloudRes.ok) {
                    const originalBuffer = Buffer.from(await cloudRes.arrayBuffer());
                    const edits = tailoredCv.appliedEdits?.bulletEdits || [];
                    const editedDocxBuffer = applyEditsToDocxBuffer(
                        originalBuffer,
                        tailoredCv.originalDocumentModel || {},
                        edits
                    );

                    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
                    res.setHeader("Content-Length", editedDocxBuffer.length);
                    return res.status(200).send(editedDocxBuffer);
                }
            } catch (cloudErr) {
                console.warn("Could not fetch remote DOCX for in-place edit:", cloudErr.message);
            }
        }

        return res.status(404).json({ message: "Native DOCX file is not available for this CV" });
    } catch (error) {
        console.error("Error downloading tailored DOCX:", error);
        return res.status(500).json({ message: error.message || "Failed to download tailored DOCX" });
    }
};

/**
 * POST /api/cv/reparse
 * Allows user to re-parse their active CV into a fresh DocumentModel,
 * or save manual corrections to the DocumentModel before tailoring.
 */
export const reparseCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { updatedDocumentModel } = req.body || {};

    try {
        const activeCv = await CV.findOne({ userId, isActive: true });
        if (!activeCv) {
            return res.status(404).json({ message: "No active CV found to re-parse" });
        }

        if (updatedDocumentModel && updatedDocumentModel.sections) {
            activeCv.documentModel = updatedDocumentModel;
            await activeCv.save();
            return res.status(200).json({
                message: "Document model updated successfully",
                documentModel: activeCv.documentModel
            });
        }

        const freshModel = parseCvToDocumentModel(
            activeCv.extractedText || "",
            activeCv.originalName || "resume.pdf"
        );
        activeCv.documentModel = freshModel;
        await activeCv.save();

        return res.status(200).json({
            message: "CV re-parsed into DocumentModel successfully",
            documentModel: freshModel,
            completenessCheck: freshModel.completenessCheck
        });
    } catch (error) {
        console.error("Error re-parsing CV:", error);
        return res.status(500).json({ message: error.message || "Failed to re-parse CV" });
    }
};

/**
 * GET /api/cv/download/:id
 * Authenticated download/stream of candidate's original uploaded CV.
 * Requires JWT, verifies document belongs to user.
 * Generates short-lived signed URL (5 minutes) with Cloudinary SDK, or streams the file
 * with Content-Disposition: attachment (or inline if ?inline=true).
 */
export const downloadOriginalCvHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let cv = null;
        if (id === "active") {
            cv = await CV.findOne({ userId, isActive: true });
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            cv = await CV.findOne({ _id: id, userId });
        }

        if (!cv) {
            cv = await CV.findOne({ userId, isActive: true });
        }

        if (!cv) {
            return res.status(404).json({ message: "CV document not found or access denied" });
        }

        const isInline = req.query.inline === "true";
        const disposition = isInline ? "inline" : "attachment";
        const filename = cv.originalName || "Resume.pdf";
        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === ".docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : ext === ".txt"
                ? "text/plain; charset=utf-8"
                : "application/pdf";

        // If client specifically asks for the short-lived signed URL
        if (req.query.action === "url" && cv.publicId && !cv.publicId.startsWith("local-") && isCloudinaryConfigured()) {
            const signedUrl = generateSignedDownloadUrl(cv.publicId, {
                resourceType: cv.resource_type || "raw",
                format: cv.format || "pdf",
                expiresInSeconds: 300
            });
            return res.status(200).json({ url: signedUrl, expiresInSeconds: 300 });
        }

        if (req.query.redirect === "true" && cv.publicId && !cv.publicId.startsWith("local-") && isCloudinaryConfigured()) {
            const signedUrl = generateSignedDownloadUrl(cv.publicId, {
                resourceType: cv.resource_type || "raw",
                format: cv.format || "pdf",
                expiresInSeconds: 300
            });
            return res.redirect(signedUrl);
        }

        // Stream from Cloudinary using signed URL
        if (cv.publicId && !cv.publicId.startsWith("local-") && isCloudinaryConfigured()) {
            try {
                const signedUrl = generateSignedDownloadUrl(cv.publicId, {
                    resourceType: cv.resource_type || "raw",
                    format: cv.format || "pdf",
                    expiresInSeconds: 300
                });
                const cloudRes = await fetch(signedUrl);
                if (cloudRes.ok) {
                    const arrayBuffer = await cloudRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    res.setHeader("Content-Type", mimeType);
                    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
                    res.setHeader("Content-Length", buffer.length);
                    return res.status(200).send(buffer);
                } else {
                    console.warn(`Cloudinary download returned HTTP ${cloudRes.status} for original CV.`);
                }
            } catch (cloudErr) {
                console.warn("Could not fetch remote Cloudinary CV buffer:", cloudErr.message);
            }
        }

        // Fallback to plain text stream if extractedText exists
        if (cv.extractedText) {
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.setHeader("Content-Disposition", `${disposition}; filename="${filename.replace(/\.[^/.]+$/, "")}.txt"`);
            return res.status(200).send(cv.extractedText);
        }

        return res.status(404).json({ message: "CV file binary is not currently available" });
    } catch (error) {
        console.error("Error downloading original CV:", error);
        return res.status(500).json({ message: error.message || "Failed to download original CV" });
    }
};

/**
 * GET /api/cv/tailored/:id/tex
 * Authenticated download of LaTeX source (.tex).
 */
export const downloadTailoredTexHandler = async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let tailoredCv = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            tailoredCv = await TailoredCV.findOne({ _id: id, userId });
        }
        if (!tailoredCv) {
            tailoredCv = await TailoredCV.findOne({ jobId: String(id), userId });
        }

        if (!tailoredCv) {
            return res.status(404).json({ message: "Tailored CV document not found" });
        }

        let texSource = tailoredCv.texSource;
        if (!texSource) {
            const candidateProfile = {
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                linkedin: user.linkedin,
                location: user.preferences?.locations?.[0] || "Sri Lanka"
            };
            texSource = renderLatexResume(candidateProfile, tailoredCv.tailoredData || {});
            tailoredCv.texSource = texSource;
            await tailoredCv.save();
        }

        const safeCandidate = (user.lastname || "Candidate").replace(/[^a-zA-Z0-9]/g, "");
        const safeCompany = (tailoredCv.jobCompany || "Tailored").replace(/[^a-zA-Z0-9]/g, "");
        const filename = `${safeCandidate}-${safeCompany}-CV.tex`;

        res.setHeader("Content-Type", "text/x-tex");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(texSource);
    } catch (error) {
        console.error("Error downloading LaTeX source:", error);
        return res.status(500).json({ message: error.message || "Failed to download LaTeX source" });
    }
};


