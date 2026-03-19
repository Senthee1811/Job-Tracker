import express from "express"; 
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createApplication, getAllApplications, modifyApplication, deleteApplication } from "../controllers/applicationController.js";

export const applicationRouter = express.Router(); 

applicationRouter.post("/create", authMiddleware, createApplication); 
applicationRouter.get("/all", authMiddleware, getAllApplications); 
applicationRouter.put("/modify/:applicationId", authMiddleware, modifyApplication); 
applicationRouter.delete("/delete/:applicationId", authMiddleware, deleteApplication);

