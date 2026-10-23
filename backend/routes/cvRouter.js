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
    parseCvSkillsHandler
} from "../controllers/cvController.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

export const cvRouter = express.Router();

cvRouter.post("/upload", authMiddleware, upload.single("cv"), uploadCVHandler);
cvRouter.get("/history", authMiddleware, getCvHistory);
cvRouter.get("/active", authMiddleware, getActiveCv);
cvRouter.delete("/:id", authMiddleware, deleteCvVersion);
cvRouter.post("/tailor", authMiddleware, tailorCvHandler);
cvRouter.get("/tailored/:jobId", authMiddleware, getTailoredCvHandler);
cvRouter.post("/apply-assisted", authMiddleware, assistedApplyHandler);
cvRouter.post("/parse-skills", authMiddleware, parseCvSkillsHandler);
