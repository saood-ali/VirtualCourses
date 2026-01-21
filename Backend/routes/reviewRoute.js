import express from "express";
import { createReview, getReviews } from "../controllers/reviewController.js";
import isAuth from "../middleware/isAuth.js";
const reviewRouter = express.Router();

reviewRouter.post("/createreview",isAuth ,createReview);
reviewRouter.get("/getreview",getReviews);

export default reviewRouter;