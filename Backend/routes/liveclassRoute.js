import express from "express";
import { getLiveSessionDetails, startLiveSession } from "../controllers/liveClass.js";
import isAuth from "../middleware/isAuth.js";

const liveclassRouter = express.Router();

// GET /api/live/details/:courseId
liveclassRouter.get("/details/:courseId", isAuth, getLiveSessionDetails);
// POST /api/live/start
liveclassRouter.post("/start", isAuth, startLiveSession);

export default liveclassRouter;