import Lecture from "../../../models/lectureModel.js";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { clearCache } from "../../../config/redis.js";
import { getEmbeddingModel, EMBEDDING_DIMENSIONS } from "../providers/geminiProvider.js";

// Gemini's batchEmbedContents accepts multiple requests per call. Keep batches
// modest to stay within request-size limits and to bound per-request latency.
const EMBED_BATCH_SIZE = Number(process.env.GEMINI_EMBED_BATCH_SIZE) || 100;

// Consider a chunk "already embedded" if it has a vector of the expected size.
const hasEmbedding = (chunk) =>
  Array.isArray(chunk.embedding) && chunk.embedding.length === EMBEDDING_DIMENSIONS;

/**
 * Generate and store embeddings for every chunk of a lecture.
 * Reuses the shared Gemini provider (no re-instantiation) and batches requests.
 *
 * Idempotent: if all chunks already have embeddings, generation is skipped.
 * Lifecycle: (post-chunking) -> EMBEDDING -> READY | FAILED
 *
 * @param {string} lectureId
 * @returns {Promise<{ embedded: number, skipped: boolean }|undefined>}
 */
export const embedLecture = async (lectureId) => {
  let markedEmbedding = false;

  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.error(`[Embedding] Lecture ${lectureId} not found.`);
      return;
    }

    const chunks = await LectureChunk.find({ lectureId }).sort({ chunkIndex: 1 });
    if (chunks.length === 0) {
      console.warn(`[Embedding] Lecture ${lectureId} has no chunks. Skipping.`);
      return;
    }

    // Idempotency: if every chunk already has a correctly-sized embedding, skip.
    const pending = chunks.filter((c) => !hasEmbedding(c));
    if (pending.length === 0) {
      if (lecture.processingStatus !== "READY") {
        lecture.processingStatus = "READY";
        await lecture.save();
        await clearCache(`lecture:${lectureId}`);
      }
      console.log(`[Embedding] Skipped lecture ${lectureId} — all ${chunks.length} chunks already embedded.`);
      return { embedded: 0, skipped: true };
    }

    lecture.processingStatus = "EMBEDDING";
    await lecture.save();
    markedEmbedding = true;
    await clearCache(`lecture:${lectureId}`);

    const model = getEmbeddingModel();

    // Process only the chunks that still need embeddings, in batches.
    const bulkOps = [];
    for (let i = 0; i < pending.length; i += EMBED_BATCH_SIZE) {
      const batch = pending.slice(i, i + EMBED_BATCH_SIZE);

      const { embeddings } = await model.batchEmbedContents({
        requests: batch.map((chunk) => ({
          content: { role: "user", parts: [{ text: chunk.text }] },
        })),
      });

      if (!embeddings || embeddings.length !== batch.length) {
        throw new Error(
          `Embedding count mismatch: requested ${batch.length}, received ${embeddings ? embeddings.length : 0}`
        );
      }

      batch.forEach((chunk, index) => {
        const values = embeddings[index]?.values;
        if (!Array.isArray(values) || values.length === 0) {
          throw new Error(`Empty embedding returned for chunk ${chunk._id}`);
        }
        bulkOps.push({
          updateOne: {
            filter: { _id: chunk._id },
            update: { $set: { embedding: values } },
          },
        });
      });
    }

    // Bulk write — one round trip instead of N individual saves.
    if (bulkOps.length > 0) {
      await LectureChunk.bulkWrite(bulkOps);
    }

    lecture.processingStatus = "READY";
    await lecture.save();
    await clearCache(`lecture:${lectureId}`);

    console.log(`[Embedding] Lecture ${lectureId} — embedded ${bulkOps.length} chunk(s), status READY.`);
    return { embedded: bulkOps.length, skipped: false };
  } catch (error) {
    console.error(`[Embedding] FAILED for lecture ${lectureId}:`, error.message);
    if (markedEmbedding) {
      try {
        await Lecture.findByIdAndUpdate(lectureId, { processingStatus: "FAILED" });
        await clearCache(`lecture:${lectureId}`);
      } catch (statusError) {
        console.error(`[Embedding] Could not set FAILED status for ${lectureId}:`, statusError.message);
      }
    }
  }
};

export default embedLecture;
