import bcrypt from "bcrypt"; 
import { User } from "../models/User.js"; 
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
    const { firstname, lastname, email, age, password } = req.body; 

    try {
        const existingUser = await User.findOne({ email }); 
        if(existingUser){
            return res.status(400).json({ message: "User Already exists "});
        }

        if(password.length < 8){
            return res.status(400).json({ message: "Password must be 8 characters length or more "});
        }

       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(password, salt); 

        const newUser = new User({
            firstname, 
            lastname, 
            password: hashedPassword, 
            age,
            email
        }); 

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        if(!token){
            return res.status(400).json({ message: "Cannot Generate Token " });
        }

        await newUser.save();

        res.status(201).json({ message: "User Registerd Successfully", user: newUser, token }); 

    } catch (error) {
        console.error("Error Occured on Register User", error);
        return res.status(500).json({ message: "Cannot Register User"}); 
    }
} 

export const loginUser = async (req,res) => {
    const { email, password } = req.body; 

    try {
        const user = await User.findOne({ email }); 
        if(!user){
            return res.status(404).json({ message: "User Not Found "});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password); 
        if(!isPasswordValid){
            return res.status(400).json({ message: "Invalid Password "});
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d"}); 

        if(!token){
            return res.status(400).json({ message: "Cannot Generate Token " });
        }

        return res.status(200).json({ message: "User Logged In Successfully ", token, user: user });
        
    } catch (error) {
        console.error("Cannot Login User ", error); 
        return res.status(500).json({ message: "Cannot Login User "});
    }
} 

export const getAllUsers = async(req,res) => {
    try {
        const users = await User.find(); 
        
        if(users.length === 0){
            return res.status(404).json({ message: "No Users Found!"});
        }

        return res.status(200).json({ message: "Users fetched successfully", users });
        
    } catch (error) {
        console.error(error.message); 
        return res.status(500).json({ message: "Cannot get all users "});
    }
}

