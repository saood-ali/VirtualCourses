import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";
import os from "os";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import Lecture from "../../models/lectureModel.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Helper: Download a remote file (e.g. Cloudinary video) to a local path.
const downloadFile = async (url, destPath) => {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

// Deterministic transcript cleaning ONLY.
// Normalizes line endings/whitespace and removes duplicated blank lines.
// It never summarizes, paraphrases, rewrites, or removes any content.
export const cleanTranscript = (raw) => {
  if (!raw) return "";
  return raw
    .replace(/\r\n/g, "\n") // normalize Windows line endings
    .replace(/\r/g, "\n") // normalize old Mac line endings
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim()) // collapse intra-line whitespace + trim
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ blank lines into a single blank line
    .trim();
};

/**
 * Background transcription for a single lecture.
 * Fire-and-forget: callers should NOT await this so the API response is unaffected.
 * Idempotent: if a usable transcript already exists it will not be regenerated.
 * Lifecycle: UPLOADED -> TRANSCRIBING -> READY | FAILED
 */
export const transcribeLecture = async (lectureId) => {
  let tempFilePath = null;
  let uploadResult = null;

  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.error(`[Transcription] Lecture ${lectureId} not found.`);
      return;
    }

    // Skip if a usable transcript already exists (do not regenerate).
    if (lecture.transcript && lecture.transcript.length >= 50) {
      if (lecture.processingStatus !== "READY") {
        lecture.processingStatus = "READY";
        await lecture.save();
      }
      console.log(`[Transcription] Skipped "${lecture.lectureTitle}" — transcript already present.`);
      return;
    }

    if (!lecture.videoUrl) {
      console.warn(`[Transcription] Lecture ${lectureId} has no videoUrl. Skipping.`);
      return;
    }

    lecture.processingStatus = "TRANSCRIBING";
    await lecture.save();
    console.log(`[Transcription] Started for "${lecture.lectureTitle}" (${lectureId}).`);

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

    tempFilePath = path.join(os.tmpdir(), `lecture-${lectureId}-${Date.now()}.mp4`);

    await downloadFile(lecture.videoUrl, tempFilePath);

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

    const result = await model.generateContent([
      {
        fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri },
      },
      { text: "Generate a detailed transcript of the spoken audio." },
    ]);

    const rawTranscript = result.response.text();
    const cleaned = cleanTranscript(rawTranscript);

    lecture.transcript = cleaned;
    lecture.processingStatus = "READY";
    await lecture.save();
    console.log(`[Transcription] READY for "${lecture.lectureTitle}" (${lectureId}).`);
  } catch (error) {
    console.error(`[Transcription] FAILED for lecture ${lectureId}:`, error.message);
    try {
      await Lecture.findByIdAndUpdate(lectureId, { processingStatus: "FAILED" });
    } catch (statusError) {
      console.error(`[Transcription] Could not set FAILED status for ${lectureId}:`, statusError.message);
    }
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (uploadResult) fileManager.deleteFile(uploadResult.file.name).catch(() => {});
  }
};

export default transcribeLecture;
