import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";

export const createApp = async () => {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/version", (req, res) => {
    res.json({
      version: process.env.API_VERSION,
      env: process.env.NODE_ENV,
    });
  });

  return app;
};
