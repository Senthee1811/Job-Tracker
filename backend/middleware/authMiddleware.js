import jwt from "jsonwebtoken"; 
import { User } from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; 
        if (!token) {
            return res.status(401).json({ message: "Unauthorized! Token missing." }); 
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid Token!" });
        }

        // Invalidate old sessions if tokenVersion doesn't match
        if (decoded.tokenVersion !== undefined) {
            const user = await User.findById(decoded.id).select("tokenVersion");
            if (!user || (user.tokenVersion || 0) !== decoded.tokenVersion) {
                return res.status(401).json({ message: "Session expired or password was changed. Please log in again." });
            }
        }

        req.user = {
            userId: decoded.id
        };
       
        next();
    } catch (error) {
        console.error("AuthMiddleware Error:", error.message); 
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};