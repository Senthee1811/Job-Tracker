import mongoose from "mongoose";

/**
 * Serverless-optimized MongoDB connection manager.
 * Caches connection promise across warm invocations on globalThis.
 * Uses 5000ms selection timeout to fail fast rather than hanging serverless invocations.
 */
let cached = globalThis.mongooseConn;

if (!cached) {
    cached = globalThis.mongooseConn = { conn: null, promise: null };
}

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MONGODB_URI is not defined in environment variables");
    }

    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10
        };

        cached.promise = mongoose.connect(uri, opts).then((m) => {
            console.log("[MongoDB] Connection established successfully");
            return m;
        }).catch((err) => {
            cached.promise = null;
            console.error("[MongoDB] Connection error:", err.message);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (err) {
        cached.promise = null;
        throw err;
    }
};