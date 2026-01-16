import express from "express";
import { createCourse, getPublishedCourses } from "../controllers/courseController";
const courseRouter = express.Router();
courseRouter.post("/create",isAuth,createCourse);
courseRouter.get("/getpublished",getPublishedCourses);
courseRouter.get("/getcreator",isAuth,getCreatorCourses);
courseRouter.post("/editcourse/:courseId",isAuth,editCourse);
