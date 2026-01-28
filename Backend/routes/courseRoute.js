import express from "express";
import { createCourse, createLecture, editCourse, 
    editLecture, 
    getCourseById, getCourseLecture, getCreatorById, getCreatorCourses, getPublishedCourses, removeCourse, 
    removeLecture} from "../controllers/courseController.js";
import upload from "../middleware/multer.js";
import isAuth from "../middleware/isAuth.js";
import { searchWithAi } from "../controllers/searchController.js";
const courseRouter = express.Router();
//for courses
courseRouter.post("/create",isAuth,createCourse);
courseRouter.get("/getpublished",getPublishedCourses);
courseRouter.get("/getcreator",isAuth,getCreatorCourses);
courseRouter.post("/editcourse/:courseId",isAuth,upload.single("courseImage"),editCourse);
courseRouter.get("/getcourse/:courseId",isAuth,getCourseById);
courseRouter.delete("/remove/:courseId",isAuth,removeCourse);

//for lectures
courseRouter.post("/createlecture/:courseId",isAuth,createLecture);
courseRouter.get("/courselecture/:courseId",isAuth,getCourseLecture);
courseRouter.post("/editlecture/:lectureId",isAuth,upload.single("videoUrl"),editLecture);
courseRouter.delete("/removelecture/:lectureId",isAuth,removeLecture);
courseRouter.post("/creator",isAuth,getCreatorById);

//for search
courseRouter.post("/search",isAuth,searchWithAi);

export default courseRouter;

