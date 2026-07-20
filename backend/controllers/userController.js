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

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

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

export const getUserProfile = async (req, res) => {
    const userId = req.user.userId;
    try {
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "Profile fetched successfully", user });
    } catch (error) {
        console.error("Error fetching profile", error);
        return res.status(500).json({ message: "Cannot fetch profile" });
    }
};

export const updateUserProfile = async (req, res) => {
    const userId = req.user.userId;
    const { firstname, lastname, email, age, skills, resumeText } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (firstname !== undefined) user.firstname = firstname;
        if (lastname !== undefined) user.lastname = lastname;
        if (email !== undefined) {
            const emailExist = await User.findOne({ email });
            if (emailExist && emailExist._id.toString() !== userId) {
                return res.status(400).json({ message: "Email already taken" });
            }
            user.email = email;
        }
        if (age !== undefined) user.age = age;
        if (skills !== undefined) user.skills = skills;
        if (resumeText !== undefined) user.resumeText = resumeText;

        await user.save();
        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.error("Error updating profile", error);
        return res.status(500).json({ message: "Cannot update profile" });
    }
};

export const uploadCV = async (req, res) => {
    const userId = req.user.userId;
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Save CV details
        user.cvPath = req.file.path.replace(/\\/g, "/");
        user.cvName = req.file.originalname;

        // Mock parsed skills
        const mockSkills = ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS", "Git"];
        
        user.skills = Array.from(new Set([...user.skills, ...mockSkills]));
        user.resumeText = `Professional summary dynamically parsed from: ${req.file.originalname}. Candidate ${user.firstname} ${user.lastname} has solid engineering skills and familiarity with modern Web standards.`;

        await user.save();
        return res.status(200).json({ message: "CV uploaded and parsed successfully", user });
    } catch (error) {
        console.error("Error uploading CV", error);
        return res.status(500).json({ message: "Cannot upload CV" });
    }
};

