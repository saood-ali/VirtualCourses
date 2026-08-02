import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import dotenv from "dotenv";

dotenv.config();

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

export const getGenerativeModel = (modelName = process.env.GEMINI_MODEL) =>
  genAI.getGenerativeModel({ model: modelName });

// Embedding model is hardcoded for v1 (frozen decision). If the embedding model
// ever changes, this is the single place to update it.
export const EMBEDDING_MODEL = "gemini-embedding-001";

// Output dimensionality for the embedding model. Must match the Atlas Vector
// Search index (see docs/atlas-vector-index.json).
export const EMBEDDING_DIMENSIONS = 3072;

// Accessor for the configured embedding model.
export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

export default {
  genAI,
  fileManager,
  getGenerativeModel,
  getEmbeddingModel,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
};
