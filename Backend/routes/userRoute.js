import express from "express";
import isAuth from "../middleware/isAuth.js";
import { getCurrentUser, updateProfile } from "../controllers/userController.js";
const userRouter = express.Router();
userRouter.get("/getCurrentUser",isAuth,getCurrentUser);
userRouter.post("/profile", isAuth, upload.single("photoUrl"),updateProfile);
export default userRouter;