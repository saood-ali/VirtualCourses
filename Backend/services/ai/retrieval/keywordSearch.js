import mongoose from "mongoose";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { RETRIEVAL_PROJECTION, createRetrievalResult } from "./retrievalResult.js";

// Deterministic keyword search. No AI, no LLM, no embeddings, and no
// MongoDB $text index — matching is a plain $in over the normalized
// LectureChunk.keywords array, and scoring happens here in the service.
//
// This keeps behaviour identical across every Atlas tier and cluster, with no
// dependency on text-index availability or Atlas Search analyzers.

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

/**
 * Count how many distinct query terms appear in a chunk's keywords.
 * Stored keywords are expected to be normalized (lowercase) at ingestion
 * time; lowercasing here as well keeps the score correct either way.
 *
 * @param {string[]} terms distinct, lowercased query terms
 * @param {string[]} keywords stored chunk keywords
 * @returns {number} number of matched terms
 */
const scoreKeywordMatches = (terms, keywords) => {
  if (!Array.isArray(keywords) || keywords.length === 0) return 0;

  const stored = new Set(keywords.map((k) => String(k).toLowerCase()));
  let matches = 0;
  for (const term of terms) {
    if (stored.has(term)) matches += 1;
  }
  return matches;
};

/**
 * Keyword retrieval arm.
 *
 * Mongo does the selection ($in), the service does the scoring. Only chunks
 * sharing at least one keyword with the query are fetched, so the candidate
 * set stays small — no collection scan and no scoring work in the database.
 *
 * Scope filters are applied in the same query, never after retrieval.
 *
 * @param {string[]} terms deterministic query terms (lowercased, de-duped)
 * @param {{ limit?: number, lectureId?: string, courseId?: string }} options
 * @returns {Promise<Array<object>>} RetrievalResult[], best first,
 *   vectorScore = 0 and rrfScore = 0
 */
export const keywordSearch = async (terms, options = {}) => {
  const { limit = 20, lectureId, courseId } = options;

  if (!Array.isArray(terms) || terms.length === 0) return [];

  const query = { keywords: { $in: terms } };

  const lectureObjectId = toObjectId(lectureId);
  if (lectureObjectId) query.lectureId = lectureObjectId;

  const courseObjectId = toObjectId(courseId);
  if (courseObjectId) query.courseId = courseObjectId;

  // Fetch only candidates that match at least one keyword (the $in does the
  // selection in Mongo), projecting the retrieval fields plus `keywords`
  // (needed for scoring) — never `embedding`. .lean() avoids hydrating
  // Mongoose documents we immediately reshape.
  const candidates = await LectureChunk.find(query, {
    ...RETRIEVAL_PROJECTION,
    keywords: 1,
  }).lean();

  return candidates
    .map((doc) =>
      createRetrievalResult(doc, { keywordScore: scoreKeywordMatches(terms, doc.keywords) })
    )
    // Drop chunks that matched nothing (score 0). The $in matched a keyword,
    // so this only filters an empty keywords array, but it guarantees the
    // arm never hands RRF a chunk with a keywordScore of 0.
    .filter((result) => result.keywordScore > 0)
    // Deterministic ordering: score desc, then a stable tiebreak so equal
    // scores always rank identically across runs.
    .sort(
      (a, b) =>
        b.keywordScore - a.keywordScore ||
        a.lectureId.localeCompare(b.lectureId) ||
        a.chunkIndex - b.chunkIndex
    )
    .slice(0, limit);
};

export default keywordSearch;
