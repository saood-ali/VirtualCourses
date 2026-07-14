import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import dotenv from "dotenv";

dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

export const getGenerativeModel = (modelName = process.env.GEMINI_MODEL) =>
  genAI.getGenerativeModel({ model: modelName });

export default { genAI, fileManager, getGenerativeModel };
