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

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Helper: Download File (Axios Version)
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

export const searchWithAi = async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) {
            return res.status(400).json({ message: "Search Query is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `You are an intelligent assistant for an
LMS platform. A user will type any query about what they
want to learn. Your task is to understand the intent and
return one ** most relevant keyword ** from the following
list of course categories and levels:

- App Development
- AI/ML
- AI Tools
- Data Science
- Data Analytics
- Ethical Hacking
- UI UX Designing
- Web Development
- Others
- Beginner
- Intermediate
- Advanced

Only reply with one single keyword from the list above that best
matches the query. Do not explain anything. No extra text.

Query: ${input}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const keyword = response.text().trim(); 

        console.log(`[AI Search] Input: "${input}" -> Keyword: "${keyword}"`);

        // --- Database Search (Unchanged) ---
        const courses = await Course.find({
            isPublished: true,
            $or: [
                { title: { $regex: input, $options: "i" } },
                { subTitle: { $regex: input, $options: "i" } },
                { description: { $regex: input, $options: "i" } },
                { category: { $regex: input, $options: "i" } },
                { level: { $regex: input, $options: "i" } }
            ]
        });

        if (courses.length > 0) {
            return res.status(200).json(courses);
        } else {
            // Fallback: Search using the AI Keyword
            const aiCourses = await Course.find({
                isPublished: true,
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { subTitle: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                    { category: { $regex: keyword, $options: "i" } },
                    { level: { $regex: keyword, $options: "i" } }
                ]
            });
            return res.status(200).json(aiCourses);
        }

    } catch (error) {
        console.error("Search Error:", error);
        return res.status(500).json({ message: `Failed to search: ${error.message}` });
    }
};

export const explainLecture = async (req, res) => {
    // Define the temp path outside try block for cleanup in finally
    let tempFilePath = null; 
    let uploadResult = null;

    try {
      const { lectureId, currentTimestamp, userQuestion } = req.body;
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }); 
  
      if (!lectureId) {
        return res.status(400).json({ message: "Lecture ID is required" });
      }
  
      const lecture = await Lecture.findById(lectureId);
      if (!lecture) return res.status(404).json({ message: "Lecture not found" });
  
      let transcriptText = lecture.transcript;
  
      // AUTO-GENERATE TRANSCRIPT (If missing) 
      if (!transcriptText || transcriptText.length < 50) {
          console.log(`⚠️ Transcript missing for "${lecture.lectureTitle}". Starting analysis...`);
          
          // Create a unique temp filename
          tempFilePath = path.join(os.tmpdir(), `lecture-${lectureId}-${Date.now()}.mp4`);
          
          try {
              // 1. Download
              console.log("⬇️ Downloading video from Cloudinary...");
              await downloadFile(lecture.videoUrl, tempFilePath);
              
              // 2. Upload to Google
              console.log("⬆️ Uploading to Gemini...");
              uploadResult = await fileManager.uploadFile(tempFilePath, {
                  mimeType: "video/mp4",
                  displayName: `Lecture_${lectureId}`,
              });
              
              // 3. Wait for Processing
              let file = await fileManager.getFile(uploadResult.file.name);
              process.stdout.write("⏳ Processing video");
              while (file.state === "PROCESSING") {
                  process.stdout.write(".");
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  file = await fileManager.getFile(uploadResult.file.name);
              }
              console.log("\n✅ Video processed.");

              if (file.state === "FAILED") {
                  throw new Error("Video processing failed by Google AI");
              }

              // 4. Generate Transcript
              console.log("🧠 Generating transcript...");
              const result = await model.generateContent([
                  {
                      fileData: {
                          mimeType: uploadResult.file.mimeType,
                          fileUri: uploadResult.file.uri
                      }
                  },
                  { text: "Generate a detailed transcript of the spoken audio in this video. Ignore background noise." }
              ]);

              transcriptText = result.response.text();

              // 5. Save to DB
              lecture.transcript = transcriptText;
              await lecture.save(); 
              console.log("💾 Transcript saved to database!");

          } catch (innerError) {
              console.error("❌ TRANSCRIPTION FAILED:", innerError.message);
              transcriptText = "I apologize, I am currently unable to analyze the video audio directly. I will answer based on the lecture title and general knowledge.";
          }
      }
  
      // Answer Question 
      const prompt = `
        You are an expert coding tutor.
        
        TRANSCRIPT START 
        ${transcriptText.substring(0, 20000)} 
        TRANSCRIPT END 
        
        CONTEXT:
        The student paused the video at timestamp: ${currentTimestamp} seconds.
        
        STUDENT QUESTION: "${userQuestion || "Explain the concept being discussed right now."}"
        
        INSTRUCTIONS:
        1. Answer strictly based on the provided transcript context if available.
        2. If the transcript is missing, answer based on the topic "${lecture.lectureTitle}".
        3. Keep the explanation clear and short (max 3 sentences).
      `;
  
      const response = await model.generateContent(prompt);
      const answer = response.response.text();
  
      return res.status(200).json({ 
        success: true, 
        answer: answer 
      });
  
    } catch (error) {
      console.error("🔥 CONTROLLER ERROR:", error);
      return res.status(500).json({ message: "Failed to generate explanation" });
    } finally {
        // CLEANUP: Delete temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        // CLEANUP: Delete from Gemini 
        if (uploadResult) {
            try {
                await fileManager.deleteFile(uploadResult.file.name);
            } catch (e) { console.log("Cleanup warning:", e.message); }
        }
    }
};