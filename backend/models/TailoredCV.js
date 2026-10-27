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
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    originalDocumentModel: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    tailoredDocumentModel: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    appliedEdits: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    docxUrl: {
        type: String,
        default: ""
    },
    docxPublicId: {
        type: String,
        default: ""
    },
    hasDocx: {
        type: Boolean,
        default: false
    },
    pdfUrl: {
        type: String,
        default: ""
    },
    pdfPublicId: {
        type: String,
        default: ""
    },
    publicId: {
        type: String,
        default: ""
    },
    resource_type: {
        type: String,
        default: "raw"
    },
    type: {
        type: String,
        default: "authenticated"
    },
    texSource: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

tailoredCvSchema.index({ userId: 1, jobId: 1 });

export const TailoredCV = mongoose.models.TailoredCV || mongoose.model("TailoredCV", tailoredCvSchema);
