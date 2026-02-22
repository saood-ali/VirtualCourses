import Course from "../models/courseModel.js";
import Lecture from "../models/lectureModel.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export const searchWithAi = async(req,res)=>{
   try {
    const {input} = req.body;
    if(!input){
        return res.status(400).json({message:"Search Query is required"})
    }
    const ai = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
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

    const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
   });
   const keyword = response.text ? response.text() : response.text;
   const courses = await Course.find({
        isPublished:true,
        $or:[
            {title:{$regex:input, $options:"i"}},
            {subTitle: {$regex:input,$options:"i"}},
            {description:{$regex:input,$options:"i"}},
            {category:{$regex:input,$options:"i"}},
            {level:{$regex:input,$options:"i"}}
        ]
    });
    if(courses.length > 0){
      return res.status(200).json(courses)
    }
    else{
        const courses = await Course.find({
        isPublished:true,
        $or:[
            {title:{$regex:keyword, $options:"i"}},
            {subTitle: {$regex:keyword,$options:"i"}},
            {description:{$regex:keyword,$options:"i"}},
            {category:{$regex:keyword,$options:"i"}},
            {level:{$regex:keyword,$options:"i"}}
        ]
    });
    return res.status(200).json(courses)
    }
    
   } catch (error) {
    return res.status(500).json({message:`Failed to search ${error.message}`})
   }
}

export const explainLecture = async (req, res) => {
    try {
      const { lectureId, currentTimestamp, userQuestion } = req.body;
  
      if (!lectureId) {
        return res.status(400).json({ message: "Lecture ID is required" });
      }
  
      const lecture = await Lecture.findById(lectureId);
      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      // Fallback if no transcript exists yet
      const contextText = lecture.transcript || `This lecture is titled "${lecture.lectureTitle}". No specific transcript is available.`;
  
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
      const prompt = `
        You are a smart tutor on "VirtualCourses".
        
        CONTEXT:
        The student is watching: "${lecture.lectureTitle}".
        Lecture Content: "${contextText.substring(0, 1500)}..."
        Timestamp: ${currentTimestamp} seconds.
        
        STUDENT QUESTION: "${userQuestion || "Explain what is happening right now."}"
        
        INSTRUCTION:
        Give a clear, short explanation (max 3 sentences). 
      `;
  
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
  
      // Handle different SDK response formats
      const answer = typeof response.text === 'function' ? response.text() : response.text;
  
      return res.status(200).json({ 
        success: true, 
        answer: answer 
      });
  
    } catch (error) {
      console.error("AI Explanation Error:", error);
      return res.status(500).json({ message: "AI Request Failed" });
    }
};