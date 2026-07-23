import express from "express"; 
import { registerUser, loginUser, getAllUsers, getUserProfile, updateUserProfile, uploadCV } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

export const userRouter = express.Router(); 

userRouter.get("/", (req,res) => {
    res.send("User Route is Working");
}); 

userRouter.post("/register", registerUser); 
userRouter.post("/login", loginUser);
userRouter.get("/all", getAllUsers);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUserProfile);
userRouter.post("/upload-cv", authMiddleware, upload.single("cv"), uploadCV);