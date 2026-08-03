import express from "express";
import { getCourseMessages } from "../controllers/chatController.js";
import isAuth from "../middleware/isAuth.js";

const chatRouter = express.Router();

chatRouter.get("/:courseId/messages", isAuth, getCourseMessages);

export default chatRouter;
