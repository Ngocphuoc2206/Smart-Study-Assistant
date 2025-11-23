import { Router } from "express";
import { getMe, login, register, updateMe } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", getMe);
authRouter.put("/me", updateMe);

export default authRouter;