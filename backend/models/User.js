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
    }
},{ timestamps: true }); 

export const User = mongoose.model("User", userSchema) || mongoose.models.User; 

