import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("DB Connected");
        return conn; // Ensure it returns!
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
};