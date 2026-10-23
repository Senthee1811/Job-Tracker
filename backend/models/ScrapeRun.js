import mongoose from "mongoose";

const scrapeRunSchema = new mongoose.Schema({
    source: {
        type: String,
        required: true,
        index: true
    },
    startedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    durationMs: {
        type: Number,
        default: 0
    },
    found: {
        type: Number,
        default: 0
    },
    new: {
        type: Number,
        default: 0
    },
    duplicates: {
        type: Number,
        default: 0
    },
    errors: [{
        type: String
    }],
    status: {
        type: String,
        enum: ["success", "partial", "failed"],
        default: "success"
    }
}, {
    timestamps: true
});

export const ScrapeRun = mongoose.models.ScrapeRun || mongoose.model("ScrapeRun", scrapeRunSchema);
