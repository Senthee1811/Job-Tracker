import express from "express";
import { registerUser, loginUser, getAllUsers, getUserProfile, updateUserProfile, getUserPreferences, updateUserPreferences } from "../controllers/userController.js";
import { changePassword, deleteAccount } from "../controllers/authController.js";
import { uploadCVHandler } from "../controllers/cvController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024 // 4 MB (Vercel serverless limit)
  }
});

export const userRouter = express.Router(); 

userRouter.get("/", (req,res) => {
    res.send("User Route is Working");
}); 

userRouter.post("/register", registerUser); 
userRouter.post("/login", loginUser);
userRouter.get("/all", getAllUsers);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUserProfile);
userRouter.get("/preferences", authMiddleware, getUserPreferences);
userRouter.put("/preferences", authMiddleware, updateUserPreferences);
userRouter.put("/change-password", authMiddleware, changePassword);
userRouter.delete("/me", authMiddleware, deleteAccount);
userRouter.post("/upload-cv", authMiddleware, upload.single("cv"), uploadCVHandler);