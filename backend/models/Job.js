import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    dedupeHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        index: true
    },
    company: {
        type: String,
        required: true,
        index: true
    },
    location: {
        type: String,
        default: "Sri Lanka",
        index: true
    },
    description: {
        type: String,
        default: ""
    },
    requirements: [{
        type: String
    }],
    skills: [{
        type: String,
        index: true
    }],
    salary: {
        type: String,
        default: "Negotiable"
    },
    jobType: {
        type: String,
        default: "Full Time" // Full Time, Part Time, Contract, Internship
    },
    mode: {
        type: String,
        enum: ["remote", "on-site", "hybrid"],
        default: "hybrid"
    },
    postedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    closingDate: {
        type: Date,
        default: null
    },
    applyUrl: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true,
        index: true // topjobs, itpro, xpressjobs, ikman, rooster, recruiter
    },
    sourceUrl: {
        type: String,
        default: ""
    },
    scrapedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
        index: { expires: 0 } // MongoDB TTL index: documents automatically deleted when expiresAt is reached
    }
}, {
    timestamps: true
});

jobSchema.index({ title: "text", description: "text", skills: "text" });

export const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);
