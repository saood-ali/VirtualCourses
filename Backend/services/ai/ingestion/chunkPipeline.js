import Lecture from "../../../models/lectureModel.js";
import Course from "../../../models/courseModel.js";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { clearCache } from "../../../config/redis.js";
import { cleanTranscript } from "./transcriptionService.js";
import { segmentTranscript } from "./sentenceSplitter.js";
import { chunkSentences } from "./semanticChunker.js";
import { estimateTokens } from "./tokenEstimator.js";

/**
 * Deterministic semantic chunking pipeline for a single lecture.
 * Transcript -> normalize -> sentence split -> semantic chunk -> LectureChunk docs.
 *
 * Idempotent: existing chunks for the lecture are deleted before re-inserting.
 * No LLM, no embeddings, no keyword generation. Timestamps are 0 (plain-text
 * transcript has no timing information).
 *
 * Lifecycle: (transcript READY) -> CHUNKING -> READY | FAILED
 *
 * @param {string} lectureId
 * @returns {Promise<{ chunkCount: number }|undefined>}
 */
export const chunkLecture = async (lectureId) => {
  let markedChunking = false;

  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.error(`[Chunking] Lecture ${lectureId} not found.`);
      return;
    }

    if (!lecture.transcript || lecture.transcript.trim().length === 0) {
      console.warn(`[Chunking] Lecture ${lectureId} has no transcript. Skipping.`);
      return;
    }

    // Resolve the owning course. LectureChunk.courseId is required, and the
    // Course<->Lecture relationship is stored on Course.lectures[].
    const course = await Course.findOne({ lectures: lectureId }).select("_id");
    if (!course) {
      console.error(`[Chunking] No course references lecture ${lectureId}. Skipping.`);
      return;
    }

    lecture.processingStatus = "CHUNKING";
    await lecture.save();
    markedChunking = true;
    await clearCache(`lecture:${lectureId}`);

    // Step 1: normalize (reuse the existing deterministic cleaner).
    const normalized = cleanTranscript(lecture.transcript);

    // Step 2: segment into sentences tagged with deterministic topic boundaries
    // (paragraph breaks / heading-like lines).
    const segments = segmentTranscript(normalized);

    // Step 3 + 4: semantic chunking with topic-continuity breaks and overlap.
    const chunks = chunkSentences(segments);

    // Idempotency: remove any prior chunks for this lecture before inserting.
    await LectureChunk.deleteMany({ lectureId });

    if (chunks.length === 0) {
      lecture.chunkCount = 0;
      lecture.processingStatus = "READY";
      await lecture.save();
      await clearCache(`lecture:${lectureId}`);
      console.log(`[Chunking] No chunks produced for lecture ${lectureId} (empty transcript).`);
      return { chunkCount: 0 };
    }

    // Step 5: build LectureChunk documents. keywords/embedding left empty;
    // timestamps set to 0 (no timing data in a plain-text transcript).
    const docs = chunks.map((chunk, index) => ({
      lectureId: lecture._id,
      courseId: course._id,
      chunkIndex: index,
      text: chunk.text,
      keywords: [],
      startTimestamp: 0,
      endTimestamp: 0,
      duration: 0,
      embedding: [],
      tokenCount: chunk.tokenCount ?? estimateTokens(chunk.text),
    }));

    // Bulk insert (never one-by-one).
    await LectureChunk.insertMany(docs);

    // Step 6: update the lecture.
    lecture.chunkCount = docs.length;
    lecture.processingStatus = "READY";
    await lecture.save();
    await clearCache(`lecture:${lectureId}`);

    // Pipeline metrics (logged, not persisted) — useful for debugging/tuning.
    const tokenCounts = docs.map((d) => d.tokenCount);
    const metrics = {
      chunkCount: docs.length,
      averageChunkTokens: Math.round(tokenCounts.reduce((a, b) => a + b, 0) / docs.length),
      largestChunk: Math.max(...tokenCounts),
      smallestChunk: Math.min(...tokenCounts),
    };
    console.log(
      `[Chunking] Lecture ${lectureId} — chunks: ${metrics.chunkCount}, ` +
        `avg: ${metrics.averageChunkTokens} tokens, ` +
        `largest: ${metrics.largestChunk}, smallest: ${metrics.smallestChunk}`
    );
    return metrics;
  } catch (error) {
    console.error(`[Chunking] FAILED for lecture ${lectureId}:`, error.message);
    // No partial chunks should remain.
    try {
      await LectureChunk.deleteMany({ lectureId });
    } catch (cleanupError) {
      console.error(`[Chunking] Cleanup of partial chunks failed for ${lectureId}:`, cleanupError.message);
    }
    if (markedChunking) {
      try {
        await Lecture.findByIdAndUpdate(lectureId, { processingStatus: "FAILED", chunkCount: 0 });
        await clearCache(`lecture:${lectureId}`);
      } catch (statusError) {
        console.error(`[Chunking] Could not set FAILED status for ${lectureId}:`, statusError.message);
      }
    }
  }
};

export default chunkLecture;
