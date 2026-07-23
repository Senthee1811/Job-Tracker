import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    date: {
        type: String, // String representation e.g. "2026-10-21" or "Oct 21, 2026"
        required: true
    },
    time: {
        type: String, // e.g. "10:00"
        required: true
    },
    color: {
        type: String, // e.g. "#a3e635" or "#ea580c"
        default: "#a3e635"
    }
}, { timestamps: true });

export const Reminder = mongoose.models.Reminder || mongoose.model("Reminder", reminderSchema);
