import dotenv from "dotenv";

//Configure dotenv
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb+srv://tranngocphuoc2000vta_db_user:Jjj6UF0p06emtc1G@cluster0.nuxtfp5.mongodb.net/",
  JWT_SECRET: process.env.JWT_SECRET || "VZpbQ-DJKSlwOzEq5-wEx4yy_D_DEbXB21tBbRppMnB-MFOz",
};