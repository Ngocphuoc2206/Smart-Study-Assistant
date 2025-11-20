import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import fs from "fs";
import morgan from "morgan";
import path from "path";

import dotenv from "dotenv";
import authMiddleware from "./middlewares/authMiddleware";
import errorHandler from "./middlewares/error";
import requestId from "./middlewares/requestID";

//Configure env from file env
dotenv.config();


export const createApp = async () => {
  await connectDB();

  const app = express();
  //Parsing request body
  app.use(express.json());

  // Createing and assigning a log file
  var accessLogStream = fs.createWriteStream(path.join(__dirname, "..", "access.log"), {
    flags: "a"
  })
  app.use(morgan("combined", { stream: accessLogStream }))

  //#region Register Middleware
  app.use(cors());
  app.use(requestId);
  app.use(authMiddleware);
  app.use(errorHandler);

  app.get("/api/version", (req, res) => {
    res.json({
      version: process.env.API_VERSION,
      env: process.env.NODE_ENV,
    });
  });

  return app;
};
