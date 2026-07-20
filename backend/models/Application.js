import mongoose from "mongoose"; 

const applicationSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    }, 
    requirements:{
        type: String, 
        required: true
    },
    mode:{
        type: String, 
        required: true,
        enum: ["remote", "on-site", "hybrid"]
    },
    salary:{
        type: Number,
        required: true,
        default: 0
    },
    location: {
        type: String, 
        required: false
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    },
    status:{
        type: String,
        required: true,
        enum: ["applied", "offered", "rejected", "interviewed"],
        default: "applied"
    },
    company:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: false,
        default: ""
    },
    opportunity:{
        type: String,
        required: false,
        default: ""
    },
    inTouchPerson:{
        type: String,
        required: false,
        default: ""
    },
    link:{
        type: String,
        required: false,
        default: ""
    }
}, {
    timestamps: true
}); 

export const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);