import Course from "../models/courseModel.js";
import Lecture from "../models/lectureModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Helper: Download File
const downloadFile = async (url, destPath) => {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

// SEARCH FEATURE 
export const searchWithAi = async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ message: "Search Query is required" });

        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
export const explainLecture = async (req, res) => {
    let tempFilePath = null; 
    let uploadResult = null;

    try {
      const { lectureId, currentTimestamp, userQuestion } = req.body;
      
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); 
  
      if (!lectureId) return res.status(400).json({ message: "Lecture ID is required" });
  
      const lecture = await Lecture.findById(lectureId);
      if (!lecture) return res.status(404).json({ message: "Lecture not found" });
  
      let transcriptText = lecture.transcript;
  
      // AUTO-GENERATE TRANSCRIPT 
      if (!transcriptText || transcriptText.length < 50) {
          console.log(`⚠️ Transcript missing for "${lecture.lectureTitle}". Starting analysis...`);
          
          tempFilePath = path.join(os.tmpdir(), `lecture-${lectureId}-${Date.now()}.mp4`);
          
          try {
              console.log("⬇️ Downloading video...");
              await downloadFile(lecture.videoUrl, tempFilePath);
              
              console.log("⬆️ Uploading to Gemini...");
              uploadResult = await fileManager.uploadFile(tempFilePath, {
                  mimeType: "video/mp4",
                  displayName: `Lecture_${lectureId}`,
              });
              
              let file = await fileManager.getFile(uploadResult.file.name);
              while (file.state === "PROCESSING") {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  file = await fileManager.getFile(uploadResult.file.name);
              }

              if (file.state === "FAILED") throw new Error("Video processing failed by Google AI");

              console.log("🧠 Generating transcript...");
              const result = await model.generateContent([
                  {
                      fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri }
                  },
                  { text: "Generate a detailed transcript of the spoken audio." }
              ]);

              transcriptText = result.response.text();
              lecture.transcript = transcriptText;
              await lecture.save(); 
              console.log("💾 Transcript saved!");

          } catch (innerError) {
              console.error("❌ TRANSCRIPTION FAILED:", innerError.message);
              // Fallback logic
              transcriptText = `Transcript unavailable for "${lecture.lectureTitle}".`;
              
              if (innerError.message.includes("404")) {
                   console.log("🔍 DIAGNOSTIC: Listing available models...");
                   console.log("Check API Key permissions in Google AI Studio.");
              }
          }
      }
  
      //  Answer Question 
      const prompt = `
        You are an expert coding tutor.
        TRANSCRIPT: ${transcriptText.substring(0, 20000)}
        QUESTION: "${userQuestion}" at ${currentTimestamp}s.
        INSTRUCTION: Answer in 2 sentences.
      `;
  
      const response = await model.generateContent(prompt);
      const answer = response.response.text();
  
      return res.status(200).json({ success: true, answer: answer });
  
    } catch (error) {
      console.error("🔥 CONTROLLER ERROR:", error.message);
      return res.status(500).json({ message: "AI Tutor is currently overloaded. Please try again later." });
    } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (uploadResult) fileManager.deleteFile(uploadResult.file.name).catch(e => {});
    }
};