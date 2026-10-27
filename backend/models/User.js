import mongoose from "mongoose"; 

const userSchema = new mongoose.Schema({
    firstname: {
        type: String, 
        required: true
    }, 
    lastname: {
        type: String, 
        required: true

    },
    email: {
        type: String, 
        required: true,
        unique: true
    }, 
    age: {
        type: Number, 
        required: true,
    },
    password: {
        type: String, 
        required: true
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Application"
    }],
    skills: [{
        type: String
    }],
    resumeText: {
        type: String,
        default: ""
    },
    cvPath: {
        type: String,
        default: ""
    },
    cvName: {
        type: String,
        default: ""
    },
    linkedin: {
        type: String,
        default: ""
    },
    preferences: {
        roles: {
            type: [{ type: String }],
            default: ["Software Engineer"]
        },
        locations: {
            type: [{ type: String }],
            default: ["Colombo", "Remote"]
        },
        jobTypes: {
            type: [{ type: String }],
            default: ["Full Time"]
        },
        experienceLevel: {
            type: String,
            default: "Mid-Level (2-5 yrs)"
        },
        keywords: {
            type: [{ type: String }],
            default: []
        },
        onboardingCompleted: {
            type: Boolean,
            default: false
        }
    },
    resetPasswordTokenHash: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
},{ timestamps: true }); 

export const User = mongoose.model("User", userSchema) || mongoose.models.User; 

