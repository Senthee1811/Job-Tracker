import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { CV } from "../models/CV.js";
import { TailoredCV } from "../models/TailoredCV.js";
import { Application } from "../models/Application.js";
import { Reminder } from "../models/Reminder.js";
import { deleteCloudinaryAsset } from "../services/cloudinaryService.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

/**
 * POST /api/auth/forgot-password
 * Generates SHA-256 hashed single-use reset token and emails the candidate.
 * Returns identical generic response whether the email exists or not (anti-enumeration).
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Generate raw 32-byte random hex token
            const resetToken = crypto.randomBytes(32).toString("hex");

            // Store SHA-256 hash and 30-minute expiry
            const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
            user.resetPasswordTokenHash = hashedToken;
            user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            await user.save();

            // Send transactional reset email
            try {
                await sendPasswordResetEmail({
                    toEmail: user.email,
                    resetToken,
                    userName: user.firstname
                });
            } catch (emailErr) {
                console.error("[ForgotPassword] Failed to send email:", emailErr.message);
            }
        }

        // Generic response prevents account enumeration
        return res.status(200).json({
            message: "If an account with that email exists, we have sent a password reset link."
        });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        return res.status(500).json({ message: "Failed to process password reset request." });
    }
};

/**
 * POST /api/auth/reset-password
 * Verifies single-use hashed token and expiry, hashes new password, and invalidates old sessions.
 */
export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Reset token is required." });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    try {
        // Hash incoming token using SHA-256
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordTokenHash: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "This password reset link is invalid or has expired. Please request a new one."
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Invalidate reset token (single-use)
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpires = null;

        // Invalidate previous sessions by incrementing tokenVersion
        user.tokenVersion = (user.tokenVersion || 0) + 1;

        await user.save();

        return res.status(200).json({
            message: "Password reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ message: "Failed to reset password." });
    }
};

/**
 * PUT /api/users/change-password
 * Authenticated password change enforcing current password verification.
 */
export const changePassword = async (req, res) => {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        // Issue fresh token with updated tokenVersion
        const freshToken = jwt.sign(
            { id: user._id, tokenVersion: user.tokenVersion },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Password changed successfully.",
            token: freshToken
        });
    } catch (error) {
        console.error("Error in changePassword:", error);
        return res.status(500).json({ message: "Failed to change password." });
    }
};

/**
 * DELETE /api/users/me
 * Full cascade account deletion:
 * 1. Verifies password and confirmation string "DELETE".
 * 2. Deletes Cloudinary assets for all CVs and TailoredCVs.
 * 3. Removes all database records: CV, TailoredCV, Application, Reminder, and User.
 */
export const deleteAccount = async (req, res) => {
    const userId = req.user?.userId;
    const { password, confirmText } = req.body;

    if (confirmText !== "DELETE") {
        return res.status(400).json({ message: 'Please type "DELETE" to confirm account deletion.' });
    }

    if (!password) {
        return res.status(400).json({ message: "Password is required to confirm account deletion." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Incorrect password." });
        }

        // 1. Delete Cloudinary assets for CVs
        try {
            const userCvs = await CV.find({ userId });
            for (const cv of userCvs) {
                if (cv.publicId && !cv.publicId.startsWith("local-cv-")) {
                    try {
                        await deleteCloudinaryAsset(cv.publicId, cv.format === "pdf" ? "auto" : "raw");
                    } catch (cloudErr) {
                        console.warn(`[DeleteAccount] Cloudinary CV delete failed (${cv.publicId}):`, cloudErr.message);
                    }
                }
            }
        } catch (cvErr) {
            console.warn("[DeleteAccount] Error reading user CVs for asset cleanup:", cvErr.message);
        }

        // 2. Delete Cloudinary assets for Tailored CV PDFs
        try {
            const tailoredDocs = await TailoredCV.find({ userId });
            for (const tCv of tailoredDocs) {
                if (tCv.pdfPublicId && !tCv.pdfPublicId.startsWith("local-tailored-")) {
                    try {
                        await deleteCloudinaryAsset(tCv.pdfPublicId, "auto");
                    } catch (cloudErr) {
                        console.warn(`[DeleteAccount] Cloudinary tailored PDF delete failed (${tCv.pdfPublicId}):`, cloudErr.message);
                    }
                }
            }
        } catch (tErr) {
            console.warn("[DeleteAccount] Error reading tailored CVs for asset cleanup:", tErr.message);
        }

        // 3. Delete all database records across collections
        await Promise.all([
            CV.deleteMany({ userId }),
            TailoredCV.deleteMany({ userId }),
            Application.deleteMany({ userId }),
            Reminder.deleteMany({ userId }),
            User.deleteOne({ _id: userId })
        ]);

        return res.status(200).json({
            message: "Account and all associated records deleted successfully."
        });
    } catch (error) {
        console.error("Error in deleteAccount cascade:", error);
        return res.status(500).json({ message: "Failed to delete account." });
    }
};
