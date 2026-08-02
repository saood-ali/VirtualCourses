import fs from "fs";
import os from "os";
import path from "path";
import Lecture from "../../../models/lectureModel.js";
import { fileManager, getGenerativeModel } from "../providers/geminiProvider.js";
import { downloadFile } from "../../../utils/fileDownloader.js";
import { clearCache } from "../../../config/redis.js";

// Maximum number of times we poll Gemini for file processing before giving up.
// Poll interval is 2s, so 60 attempts ~= 2 minutes of processing wait.
const MAX_POLL_ATTEMPTS = Number(process.env.GEMINI_MAX_POLL_ATTEMPTS) || 60;
const POLL_INTERVAL_MS = 2000;

// Production-quality transcription prompt.
// Produces a verbatim, plain-text transcript suitable for semantic chunking.
const TRANSCRIPTION_PROMPT = `You are a professional transcription engine. Produce a VERBATIM transcript of the spoken audio in this video.

Rules:
- Transcribe exactly what is said, word for word.
- Preserve all technical terminology, programming language keywords, class names, function names, API names, and code-related vocabulary exactly as spoken.
- Do NOT summarize, explain, or rewrite anything.
- Do NOT remove meaningful filler words that carry conversational meaning.
- Return PLAIN TEXT only.
- Do NOT use Markdown.
- Do NOT add headings, labels, speaker names, or timestamps.

Output only the transcript text.`;

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
 * Idempotent: if a usable transcript already exists it will not be regenerated.
 *
 * Stage-only: this sets TRANSCRIBING and leaves it there on success. It does
 * NOT set READY — only the orchestrator (lecturePipeline.js) may do that, once
 * the lecture is actually searchable. Call it via runLecturePipeline().
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

    const model = getGenerativeModel();

    tempFilePath = path.join(os.tmpdir(), `lecture-${lectureId}-${Date.now()}.mp4`);

    await downloadFile(lecture.videoUrl, tempFilePath);

    uploadResult = await fileManager.uploadFile(tempFilePath, {
      mimeType: "video/mp4",
      displayName: `Lecture_${lectureId}`,
    });

    // Poll for Gemini file processing with a bounded number of attempts.
    let file = await fileManager.getFile(uploadResult.file.name);
    let attempts = 0;
    while (file.state === "PROCESSING") {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        throw new Error(
          `Gemini file processing timed out after ${MAX_POLL_ATTEMPTS} attempts (~${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s)`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      file = await fileManager.getFile(uploadResult.file.name);
      attempts += 1;
    }

    if (file.state === "FAILED") throw new Error("Video processing failed by Google AI");

    const result = await model.generateContent([
      {
        fileData: { mimeType: uploadResult.file.mimeType, fileUri: uploadResult.file.uri },
      },
      { text: TRANSCRIPTION_PROMPT },
    ]);

    const rawTranscript = result.response.text();
    const cleaned = cleanTranscript(rawTranscript);

    // Status stays TRANSCRIBING; the orchestrator advances it to the next stage.
    lecture.transcript = cleaned;
    await lecture.save();

    // Invalidate cached lecture so readers see the fresh transcript/status.
    await clearCache(`lecture:${lectureId}`);
    console.log(`[Transcription] READY for "${lecture.lectureTitle}" (${lectureId}).`);
  } catch (error) {
    console.error(`[Transcription] FAILED for lecture ${lectureId}:`, error.message);
    try {
      await Lecture.findByIdAndUpdate(lectureId, { processingStatus: "FAILED" });
      await clearCache(`lecture:${lectureId}`);
    } catch (statusError) {
      console.error(`[Transcription] Could not set FAILED status for ${lectureId}:`, statusError.message);
    }
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    if (uploadResult) fileManager.deleteFile(uploadResult.file.name).catch(() => {});
  }
};

export default transcribeLecture;
