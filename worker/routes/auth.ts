import { Router } from "express";

import { getMe, login, register, updateMe } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", getMe);
authRouter.put("/me", updateMe);

export default authRouter;



<<<<<<< HEAD
export default authRouter;
=======
>>>>>>> 4ca674b120aa3808e12655526de92532e2ab7fc3
