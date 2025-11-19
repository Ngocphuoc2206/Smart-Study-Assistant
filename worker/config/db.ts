import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error("[DB] MongoDB connection error:", error);
        process.exit(1);
    }
}