import { Router } from "express";
import { success } from "zod";

const router = Router();
router.get("/", (req, res) => {
    res.json({success: true, message: "Backend is healthy"});
})