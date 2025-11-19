import dotenv from "dotenv";

//Configure dotenv
dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 5001,
    
}