import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("[DB] MONGODB_URI =", uri);
    if (!uri) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    await mongoose.connect(uri);
    console.log("[DB] Connected to MongoDB");
  } catch (error) {
    console.error("[DB] MongoDB connection error:", error);
    process.exit(1);
  }
};
