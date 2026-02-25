import express from "express";
import { getLiveSessionDetails } from "../controllers/liveClass.js";
import isAuth from "../middleware/isAuth.js";

const liveclassRouter = express.Router();

// GET /api/live/details/:courseId
liveclassRouter.get("/details/:courseId", isAuth, getLiveSessionDetails);

export default liveclassRouter;