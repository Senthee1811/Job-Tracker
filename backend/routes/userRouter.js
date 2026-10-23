import express from "express"; 
import { registerUser, loginUser, getAllUsers, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { uploadCVHandler } from "../controllers/cvController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
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
userRouter.post("/upload-cv", authMiddleware, upload.single("cv"), uploadCVHandler);