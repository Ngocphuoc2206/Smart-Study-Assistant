import { Router } from "express";

import { getMe, login, logout, refresh, register, updateMe } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", getMe);
authRouter.put("/me", updateMe);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

export default authRouter;
