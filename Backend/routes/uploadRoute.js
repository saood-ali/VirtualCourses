import express from 'express';
import { isAuth } from '../middleware/isAuth.js'; 
import { generateSignature } from '../controllers/uploadController.js';

const uploadRouter = express.Router();

// Protected route
uploadRouter.get('/signature', isAuth, generateSignature);

export default uploadRouter;