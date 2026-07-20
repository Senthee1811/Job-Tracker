import express from "express"; 
import { registerUser, loginUser, getAllUsers, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const userRouter = express.Router(); 

userRouter.get("/", (req,res) => {
    res.send("User Route is Working");
}); 

userRouter.post("/register", registerUser); 
userRouter.post("/login", loginUser);
userRouter.get("/all", getAllUsers);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUserProfile);