import mongoose from "mongoose";

const tailoredCvSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    jobId: {
        type: String,
        required: true,
        index: true
    },
    jobTitle: {
        type: String,
        default: ""
    },
    jobCompany: {
        type: String,
        default: ""
    },
    tailoredData: {
        summary: { type: String, default: "" },
        highlightedSkills: [{ type: String }],
        experience: [{ type: mongoose.Schema.Types.Mixed }],
        education: [{ type: mongoose.Schema.Types.Mixed }],
        projects: [{ type: mongoose.Schema.Types.Mixed }]
    },
    pdfUrl: {
        type: String,
        default: ""
    },
    pdfPublicId: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

tailoredCvSchema.index({ userId: 1, jobId: 1 });

export const TailoredCV = mongoose.models.TailoredCV || mongoose.model("TailoredCV", tailoredCvSchema);
