import Course from "../models/courseModel.js";
import Lecture from "../models/lectureModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { normalizeQuery } from "../services/ai/retrieval/queryPreprocessor.js";
import { retrieveChunks } from "../services/ai/retrieval/retrievalPipeline.js";
import { rerankChunks, RERANK_TOP_N } from "../services/ai/generation/reranker.js";
import { generateAnswer } from "../services/ai/generation/answerGenerator.js";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// SEARCH FEATURE
export const searchWithAi = async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ message: "Search Query is required" });

        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

        const prompt = `You are an intelligent assistant for an LMS. Return ONE keyword from this list: 
        [App Development, AI/ML, AI Tools, Data Science, Data Analytics, Ethical Hacking, UI UX Designing, Web Development, Others, Beginner, Intermediate, Advanced]
        that matches: "${input}". Output ONLY the keyword.`;

        const result = await model.generateContent(prompt);
        const keyword = result.response.text().trim();

        console.log(`[AI Search] Input: "${input}" -> Keyword: "${keyword}"`);

        // Database Search
        const query = { $regex: input, $options: "i" };
        const courses = await Course.find({
            isPublished: true,
            $or: [{ title: query }, { subTitle: query }, { description: query }, { category: query }, { level: query }]
        });

        if (courses.length > 0) return res.status(200).json(courses);

        // Fallback Search
        const aiQuery = { $regex: keyword, $options: "i" };
        const aiCourses = await Course.find({
            isPublished: true,
            $or: [{ title: aiQuery }, { subTitle: aiQuery }, { description: aiQuery }, { category: aiQuery }, { level: aiQuery }]
        });
        
        return res.status(200).json(aiCourses);

    } catch (error) {
        console.error("Search Error:", error.message);
        return res.status(500).json({ message: `Search failed` });
    }
};

// EXPLAIN LECTURE FEATURE
// Hybrid RAG: retrieval (vector + keyword + RRF) -> Gemini rerank -> answer.
// Exactly two Gemini calls per request: one rerank, one generation.
//
// Transcription/chunking/embedding are the ingestion pipeline's job, so this
// controller no longer downloads or transcribes video inline. If a lecture has
// not been ingested yet there is nothing to retrieve, and the request returns
// a clear "not ready" message instead of blocking on a long video upload.
export const explainLecture = async (req, res) => {
    try {
      const { lectureId, userQuestion } = req.body;

      if (!lectureId) return res.status(400).json({ message: "Lecture ID is required" });

      const lecture = await Lecture.findById(lectureId).select("lectureTitle processingStatus chunkCount");
      if (!lecture) return res.status(404).json({ message: "Lecture not found" });

      const question = normalizeQuery(userQuestion);
      if (!question) {
        return res.status(400).json({ message: "A question is required" });
      }

      // Step 1 — hybrid retrieval, scoped to this lecture (filter applied
      // inside the Atlas query, not after).
      const { chunks: retrieved } = await retrieveChunks(question, { lectureId });

      if (retrieved.length === 0) {
        // Either the lecture has not finished ingestion, or nothing matched.
        // READY with no chunks means the old pipeline marked it READY before
        // chunking ran; the lecture is still being processed. A lecture that
        // finished ingestion but had no matching chunks reports READY with a
        // chunkCount > 0 — that is the genuine "no match" case.
        const stillProcessing =
          lecture.processingStatus !== "READY" || lecture.chunkCount === 0;

        console.log(
          `[ExplainLecture] No chunks for lecture ${lectureId} ` +
            `(status=${lecture.processingStatus}, chunks=${lecture.chunkCount}).`
        );

        return res.status(200).json({
          success: true,
          answer: stillProcessing
            ? "This lecture is still being processed. Please try again in a few minutes."
            : "I couldn't find anything in this lecture related to that question. Try rephrasing it.",
          sources: [],
        });
      }

      // Step 2 — rerank the top 12 down to the top 4 (one Gemini call).
      const reranked = await rerankChunks(question, retrieved, { topN: RERANK_TOP_N });

      // Step 3 — generate the answer from those 4 chunks (one Gemini call).
      // Timestamps in `sources` come from the chunk documents, never from the model.
      const { answer, sources } = await generateAnswer(question, reranked);

      console.log(
        `[ExplainLecture] lecture=${lectureId} retrieved=${retrieved.length} ` +
          `reranked=${reranked.length} sources=${sources.length}`
      );

      // `success` and `answer` preserve the existing frontend contract;
      // `sources` is additive. No embeddings or internal scores are exposed.
      return res.status(200).json({ success: true, answer, sources });

    } catch (error) {
      console.error("🔥 CONTROLLER ERROR:", error.message);
      return res.status(500).json({ message: "AI Tutor is currently overloaded. Please try again later." });
    }
};
