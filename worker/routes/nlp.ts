import { Router } from "express";
import { detectIntentHandler } from "../controllers/nlp";

const nlpRouter = Router();

//POST /api/nlp/detect-intent
nlpRouter.post("/detect-intent", detectIntentHandler);

export default nlpRouter;
