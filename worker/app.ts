/* eslint-disable no-var */
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import fs from "fs";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import authMiddleware from "./middlewares/authMiddleware";
import errorHandler from "./middlewares/error";
import requestId from "./middlewares/requestID";
import authRouter from "./routes/auth";
import taskRouter from "./routes/task";
import scheduleRouter from "./routes/schedule";
import nlpRouter from "./routes/nlp";
import courseRouter from "./routes/course";
import chatHistoryRouter from "./routes/chatHistory";
import teacherRouter from "./routes/teacher";
import remindRouter from "./routes/reminder";
import chatRouter from "./routes/chat";
//Configure env from file env
dotenv.config();


export const createApp = async () => {
  await connectDB();

  const app = express();
  //Parsing request body
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));


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
  //#endregion

  //Route
  app.use("/api/auth", authRouter);
  app.use("/api/task", taskRouter);
  app.use("/api/schedule", scheduleRouter);
  app.use("/api/nlp", nlpRouter);
  app.use("/api/course", courseRouter);
  app.use("/api/chat-history", chatHistoryRouter);
  app.use("/api/teacher", teacherRouter);
  app.use("/api/reminder", remindRouter);
  app.use("/api/chat", chatRouter);
  app.get("/api/version", (req, res) => {
    res.json({
      version: process.env.API_VERSION,
      env: process.env.NODE_ENV,
    });
  });

  return app;
};
