import mongoose from "mongoose";

const cvSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    publicId: {
        type: String,
        required: true
    },
    secureUrl: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    format: {
        type: String,
        required: true
    },
    bytes: {
        type: Number,
        required: true
    },
    version: {
        type: Number,
        required: true,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    extractedText: {
        type: String,
        default: ""
    },
    structuredProfile: {
        skills: [{ type: String }],
        yearsOfExperience: { type: Number, default: 0 },
        roles: [{ type: String }],
        education: [{ type: mongoose.Schema.Types.Mixed }],
        projects: [{ type: mongoose.Schema.Types.Mixed }],
        certifications: [{ type: mongoose.Schema.Types.Mixed }]
    }
}, {
    timestamps: true
});

cvSchema.index({ userId: 1, version: -1 });

export const CV = mongoose.models.CV || mongoose.model("CV", cvSchema);
