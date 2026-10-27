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
    resource_type: {
        type: String,
        default: "raw"
    },
    type: {
        type: String,
        default: "authenticated"
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
    documentModel: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    structuredProfile: {
        skills: [{ type: String }],
        yearsOfExperience: { type: Number, default: 0 },
        roles: [{ type: String }],
        education: [{ type: mongoose.Schema.Types.Mixed }],
        projects: [{ type: mongoose.Schema.Types.Mixed }],
        certifications: [{ type: mongoose.Schema.Types.Mixed }]
    },
    analysisReport: {
        overallScore: { type: Number, default: 0 },
        atsScore: { type: Number, default: 0 },
        impactScore: { type: Number, default: 0 },
        brevityScore: { type: Number, default: 0 },
        skillsScore: { type: Number, default: 0 },
        summary: { type: String, default: "" },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        missingKeywords: [{ type: String }],
        actionableSuggestions: [{
            section: { type: String },
            issue: { type: String },
            recommendation: { type: String }
        }],
        tailoredRoles: [{ type: String }],
        analyzedAt: { type: Date }
    }
}, {
    timestamps: true
});

cvSchema.index({ userId: 1, version: -1 });

export const CV = mongoose.models.CV || mongoose.model("CV", cvSchema);
