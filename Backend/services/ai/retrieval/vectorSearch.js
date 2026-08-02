import mongoose from "mongoose";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { getEmbeddingModel, EMBEDDING_DIMENSIONS } from "../providers/geminiProvider.js";

// Atlas Vector Search index name. Must match the index created manually in
// Atlas from docs/atlas-vector-index.json (cosine similarity, 3072 dims,
// filter fields: courseId, lectureId).
export const VECTOR_INDEX_NAME =
  process.env.ATLAS_VECTOR_INDEX || "lecture_chunk_vector_index";

// Candidates Atlas considers before returning `limit`. Atlas recommends
// numCandidates >> limit for good recall.
const NUM_CANDIDATES_MULTIPLIER = 10;

// Fields returned to the caller. `embedding` is deliberately excluded so
// vectors never leave MongoDB.
const PROJECTION = {
  _id: 1,
  lectureId: 1,
  courseId: 1,
  chunkIndex: 1,
  text: 1,
  startTimestamp: 1,
  endTimestamp: 1,
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

/**
 * Embed a single query string using the SAME model used for LectureChunk
 * embeddings. Reuses the shared Gemini provider — no re-instantiation.
 *
 * @param {string} normalizedQuery
 * @returns {Promise<number[]>}
 */
export const embedQuery = async (normalizedQuery) => {
  if (!normalizedQuery) throw new Error("Cannot embed an empty query.");

  const model = getEmbeddingModel();
  const { embedding } = await model.embedContent({
    content: { role: "user", parts: [{ text: normalizedQuery }] },
  });

  const values = embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini returned an empty query embedding.");
  }
  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Query embedding dimension mismatch: got ${values.length}, expected ${EMBEDDING_DIMENSIONS}.`
    );
  }

  return values;
};

/**
 * Build the Atlas `filter` sub-document. Filtering happens INSIDE the Atlas
 * query (both paths are declared as filter fields in the index), never as a
 * post-retrieval pass in Node.
 *
 * @param {{ lectureId?: string, courseId?: string }} scope
 * @returns {object|null}
 */
const buildAtlasFilter = ({ lectureId, courseId } = {}) => {
  const clauses = {};

  const lectureObjectId = toObjectId(lectureId);
  if (lectureObjectId) clauses.lectureId = { $eq: lectureObjectId };

  const courseObjectId = toObjectId(courseId);
  if (courseObjectId) clauses.courseId = { $eq: courseObjectId };

  return Object.keys(clauses).length > 0 ? clauses : null;
};

/**
 * Atlas Vector Search over LectureChunk.embedding (cosine similarity).
 * Executes entirely inside MongoDB Atlas — no embeddings are loaded into Node.
 *
 * @param {number[]} queryEmbedding
 * @param {{ limit?: number, lectureId?: string, courseId?: string }} options
 * @returns {Promise<Array<object>>} ranked results, best first
 */
export const vectorSearch = async (queryEmbedding, options = {}) => {
  const { limit = 20, lectureId, courseId } = options;

  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error("vectorSearch requires a non-empty query embedding.");
  }

  const stage = {
    index: VECTOR_INDEX_NAME,
    path: "embedding",
    queryVector: queryEmbedding,
    numCandidates: limit * NUM_CANDIDATES_MULTIPLIER,
    limit,
  };

  const filter = buildAtlasFilter({ lectureId, courseId });
  if (filter) stage.filter = filter;

  return LectureChunk.aggregate([
    { $vectorSearch: stage },
    { $project: { ...PROJECTION, vectorScore: { $meta: "vectorSearchScore" } } },
  ]);
};

export default vectorSearch;
