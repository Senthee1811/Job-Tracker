import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    uploadCVHandler,
    getCvHistory,
    getActiveCv,
    deleteCvVersion,
    tailorCvHandler,
    getTailoredCvHandler,
    assistedApplyHandler,
    parseCvSkillsHandler,
    analyzeCvHandler,
    downloadAnalysisPdfHandler,
    downloadTailoredPdfHandler,
    downloadTailoredTexHandler,
    downloadTailoredDocxHandler,
    downloadOriginalCvHandler,
    reparseCvHandler
} from "../controllers/cvController.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 4 * 1024 * 1024 // 4 MB limit for Vercel Serverless Function payload
    }
});

export const cvRouter = express.Router();

cvRouter.post("/upload", authMiddleware, upload.single("cv"), uploadCVHandler);
cvRouter.get("/download/:id", authMiddleware, downloadOriginalCvHandler);
cvRouter.get("/history", authMiddleware, getCvHistory);
cvRouter.get("/active", authMiddleware, getActiveCv);
cvRouter.delete("/:id", authMiddleware, deleteCvVersion);
cvRouter.post("/tailor", authMiddleware, tailorCvHandler);
cvRouter.post("/reparse", authMiddleware, reparseCvHandler);
cvRouter.get("/tailored/:jobId", authMiddleware, getTailoredCvHandler);
cvRouter.get("/tailored/:id/pdf", authMiddleware, downloadTailoredPdfHandler);
cvRouter.get("/tailored/:id/docx", authMiddleware, downloadTailoredDocxHandler);
cvRouter.get("/tailored/:id/tex", authMiddleware, downloadTailoredTexHandler);
cvRouter.post("/apply-assisted", authMiddleware, assistedApplyHandler);
cvRouter.post("/parse-skills", authMiddleware, parseCvSkillsHandler);
cvRouter.post("/analyze", authMiddleware, analyzeCvHandler);
cvRouter.get("/analysis/:id/report.pdf", authMiddleware, downloadAnalysisPdfHandler);

