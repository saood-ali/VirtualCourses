import mongoose from "mongoose";
import Lecture from "../../../models/lectureModel.js";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { clearCache } from "../../../config/redis.js";
import { transcribeLecture } from "./transcriptionService.js";
import { chunkLecture } from "./chunkPipeline.js";
import { embedLecture } from "./embeddingService.js";
import { vectorSearch } from "../retrieval/vectorSearch.js";

// Orchestrates the full ingestion pipeline for one lecture:
//
//   UPLOADED -> TRANSCRIBING -> CHUNKING -> EMBEDDING -> INDEXING -> READY | FAILED
//
// Each stage is an existing, idempotent service — this file only sequences them
// and owns the meaning of READY. Previously every service set READY at its own
// end, so a lecture with only a transcript already reported READY while vector
// search returned nothing. Now READY is set in exactly one place: after the
// Atlas vector index has been observed returning this lecture's own chunks.

// Fine-grained stages the UI renders, in order.
export const PROCESSING_STAGES = ["TRANSCRIBING", "CHUNKING", "EMBEDDING", "INDEXING"];

// User-facing copy per stage. Chunking builds the searchable units; indexing is
// the wait for Atlas to actually serve them — distinct steps to a user watching
// a checklist, so they get distinct labels.
const STAGE_MESSAGES = {
  TRANSCRIBING: "Generating transcript...",
  CHUNKING: "Building search index...",
  EMBEDDING: "Generating embeddings...",
  INDEXING: "Finalizing search index...",
};

const PENDING_MESSAGE = "Waiting to start processing...";
const READY_MESSAGE = "Lecture is ready.";
const FAILED_MESSAGE = "Processing failed. Try uploading the video again.";

// Atlas indexes vectors asynchronously: freshly written embeddings are not
// immediately queryable. Poll until they are, so READY never lies.
const INDEX_POLL_INTERVAL_MS = 2000;
const INDEX_POLL_TIMEOUT_MS = Number(process.env.ATLAS_INDEX_TIMEOUT_MS) || 90000;

const setStatus = async (lectureId, processingStatus) => {
  await Lecture.findByIdAndUpdate(lectureId, { processingStatus });
  await clearCache(`lecture:${lectureId}`);
};

/**
 * Wait until this lecture's chunks are actually returned by Atlas vector search.
 *
 * Uses one of the lecture's OWN stored embeddings as the query vector and
 * filters to its own lectureId, so a hit proves precisely what READY claims:
 * that a question about this lecture will retrieve something. (Reading a single
 * embedding here is a deliberate, bounded exception to the "never load
 * embeddings into Node" rule, which governs the retrieval/scoring path — it
 * avoids spending a Gemini call just to probe readiness.)
 *
 * @param {string} lectureId
 * @returns {Promise<boolean>} true if the index served this lecture in time
 */
const waitForVectorIndex = async (lectureId) => {
  const probe = await LectureChunk.findOne({ lectureId })
    .select("embedding")
    .lean();

  if (!probe?.embedding?.length) {
    console.warn(`[Pipeline] No embedding to probe with for lecture ${lectureId}.`);
    return false;
  }

  const deadline = Date.now() + INDEX_POLL_TIMEOUT_MS;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const hits = await vectorSearch(probe.embedding, { lectureId, limit: 1 });
      if (hits.length > 0) {
        console.log(`[Pipeline] Vector index ready for lecture ${lectureId} (attempt ${attempt}).`);
        return true;
      }
    } catch (error) {
      // A transient Atlas error should not abort the pipeline; keep polling
      // until the deadline and let the timeout decide.
      console.warn(`[Pipeline] Index probe attempt ${attempt} failed:`, error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, INDEX_POLL_INTERVAL_MS));
  }

  console.warn(
    `[Pipeline] Vector index for lecture ${lectureId} not queryable within ` +
      `${INDEX_POLL_TIMEOUT_MS}ms. Marking READY anyway (keyword search still works).`
  );
  return false;
};

/**
 * Run the full ingestion pipeline for a lecture.
 *
 * Fire-and-forget: callers should NOT await this, so the API response is not
 * blocked by minutes of transcription. Every stage is idempotent, so re-running
 * a partially-processed lecture resumes rather than duplicating work.
 *
 * @param {string} lectureId
 * @returns {Promise<{ status: string, chunkCount: number }|undefined>}
 */
export const runLecturePipeline = async (lectureId) => {
  try {
    const lecture = await Lecture.findById(lectureId).select("processingStatus lectureTitle");
    if (!lecture) {
      console.error(`[Pipeline] Lecture ${lectureId} not found.`);
      return;
    }

    // Guard against concurrent runs: two pipelines on one lecture would race on
    // chunk deletion/insertion and corrupt chunk indices.
    if (PROCESSING_STAGES.includes(lecture.processingStatus)) {
      console.log(
        `[Pipeline] Lecture ${lectureId} already processing (${lecture.processingStatus}). Skipping duplicate run.`
      );
      return;
    }

    console.log(`[Pipeline] START "${lecture.lectureTitle}" (${lectureId}).`);

    // Stage 1 — transcript. Skips itself if a usable transcript already exists.
    await transcribeLecture(lectureId);
    const afterTranscript = await Lecture.findById(lectureId).select("processingStatus transcript");
    if (afterTranscript?.processingStatus === "FAILED") {
      console.error(`[Pipeline] ABORT at transcription for ${lectureId}.`);
      return;
    }
    if (!afterTranscript?.transcript?.trim()) {
      console.error(`[Pipeline] ABORT: no transcript produced for ${lectureId}.`);
      await setStatus(lectureId, "FAILED");
      return;
    }

    // Stage 2 — chunks.
    await chunkLecture(lectureId);
    const afterChunks = await Lecture.findById(lectureId).select("processingStatus chunkCount");
    if (afterChunks?.processingStatus === "FAILED") {
      console.error(`[Pipeline] ABORT at chunking for ${lectureId}.`);
      return;
    }
    if (!afterChunks?.chunkCount) {
      // An empty transcript yields no chunks; nothing downstream can run.
      console.warn(`[Pipeline] Lecture ${lectureId} produced 0 chunks. Nothing to embed.`);
      await setStatus(lectureId, "READY");
      return { status: "READY", chunkCount: 0 };
    }

    // Stage 3 — embeddings.
    await embedLecture(lectureId);
    const afterEmbedding = await Lecture.findById(lectureId).select("processingStatus chunkCount");
    if (afterEmbedding?.processingStatus === "FAILED") {
      console.error(`[Pipeline] ABORT at embedding for ${lectureId}.`);
      return;
    }

    // Stage 4 — wait for Atlas to actually serve those vectors. This is the
    // window the "Processing" state exists to hide.
    await setStatus(lectureId, "INDEXING");
    await waitForVectorIndex(lectureId);

    await setStatus(lectureId, "READY");
    console.log(`[Pipeline] READY "${lecture.lectureTitle}" (${lectureId}), ${afterEmbedding.chunkCount} chunk(s).`);
    return { status: "READY", chunkCount: afterEmbedding.chunkCount };
  } catch (error) {
    console.error(`[Pipeline] FAILED for lecture ${lectureId}:`, error.message);
    try {
      await setStatus(lectureId, "FAILED");
    } catch (statusError) {
      console.error(`[Pipeline] Could not set FAILED for ${lectureId}:`, statusError.message);
    }
  }
};

/**
 * Describe a lecture's processing state for the UI.
 *
 * Derives the fine-grained stage from persisted state rather than storing it,
 * so polling never costs a write. Returns null when the lecture does not exist
 * so the caller can answer 404.
 *
 * @param {string} lectureId
 * @returns {Promise<{ status: string, stage: string|null, stages: string[], message: string, chunkCount: number }|null>}
 */
export const getLectureProcessingStatus = async (lectureId) => {
  if (!mongoose.Types.ObjectId.isValid(lectureId)) return null;

  const lecture = await Lecture.findById(lectureId)
    .select("processingStatus chunkCount transcript")
    .lean();
  if (!lecture) return null;

  const { processingStatus, chunkCount = 0 } = lecture;
  const base = { stages: PROCESSING_STAGES, chunkCount };

  if (processingStatus === "FAILED") {
    return { ...base, status: "FAILED", stage: null, message: FAILED_MESSAGE };
  }

  if (PROCESSING_STAGES.includes(processingStatus)) {
    return { ...base, status: "PROCESSING", stage: processingStatus, message: STAGE_MESSAGES[processingStatus] };
  }

  if (processingStatus === "READY") {
    // Legacy rows: older pipeline stages set READY at their own end, so a
    // lecture can be READY with no chunks. Report the real remaining work
    // rather than claiming the AI tutor is available.
    if (chunkCount === 0) {
      const stage = lecture.transcript?.trim() ? "CHUNKING" : "TRANSCRIBING";
      return { ...base, status: "PROCESSING", stage, message: STAGE_MESSAGES[stage] };
    }
    return { ...base, status: "READY", stage: null, message: READY_MESSAGE };
  }

  // UPLOADED (or anything unrecognized): queued, not yet started.
  return { ...base, status: "PENDING", stage: null, message: PENDING_MESSAGE };
};

export default runLecturePipeline;
