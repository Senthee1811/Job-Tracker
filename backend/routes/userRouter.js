import express from "express"; 
import { registerUser, loginUser, getAllUsers } from "../controllers/userController.js";

export const userRouter = express.Router(); 

userRouter.get("/", (req,res) => {
    res.send("User Route is Working");
}); 

userRouter.post("/register", registerUser); 
userRouter.post("/login", loginUser);
userRouter.get("/all", getAllUsers);