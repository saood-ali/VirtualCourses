import mongoose from "mongoose";
import LectureChunk from "../../../models/lectureChunkModel.js";
import { escapeRegex } from "./queryPreprocessor.js";

// Fields returned to the caller. `embedding` is deliberately excluded.
const PROJECTION = {
  _id: 1,
  lectureId: 1,
  courseId: 1,
  chunkIndex: 1,
  text: 1,
  startTimestamp: 1,
  endTimestamp: 1,
};

// A match on the curated `keywords` array is a stronger signal than an
// incidental occurrence in the chunk body, so it is weighted higher. Both
// weights are fixed constants — scoring stays fully deterministic.
const KEYWORD_FIELD_WEIGHT = 2;
const TEXT_FIELD_WEIGHT = 1;

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

/**
 * Deterministic keyword search. No AI, no LLM, no embeddings.
 *
 * Score = (weighted) count of distinct query terms matched:
 *   - each term present in LectureChunk.keywords  -> KEYWORD_FIELD_WEIGHT
 *   - each term present in LectureChunk.text      -> TEXT_FIELD_WEIGHT
 *
 * `keywords` is the primary field per the design. The `text` arm exists
 * because keyword extraction is not yet part of ingestion (chunkPipeline
 * currently stores `keywords: []`), so a keywords-only search would score
 * every chunk 0 against existing data. Once keywords are populated they
 * simply dominate the score — no code change needed.
 *
 * Counting is done inside MongoDB via $setIntersection / $reduce; no chunk
 * bodies are scanned in Node.
 *
 * @param {string[]} terms deterministic query terms (lowercased, de-duped)
 * @param {{ limit?: number, lectureId?: string, courseId?: string }} options
 * @returns {Promise<Array<object>>} ranked results, best first
 */
export const keywordSearch = async (terms, options = {}) => {
  const { limit = 20, lectureId, courseId } = options;

  if (!Array.isArray(terms) || terms.length === 0) return [];

  // Case-insensitive whole-word regexes, anchored on word boundaries so
  // "map" does not match "mapping". User input is escaped.
  const textRegexes = terms.map((term) => new RegExp(`\\b${escapeRegex(term)}\\b`, "i"));

  const match = {
    $or: [{ keywords: { $in: terms } }, { text: { $in: textRegexes } }],
  };

  const lectureObjectId = toObjectId(lectureId);
  if (lectureObjectId) match.lectureId = lectureObjectId;

  const courseObjectId = toObjectId(courseId);
  if (courseObjectId) match.courseId = courseObjectId;

  return LectureChunk.aggregate([
    { $match: match },
    {
      $addFields: {
        // Distinct query terms found in the curated keywords array.
        _keywordHits: {
          $size: {
            $setIntersection: [
              terms,
              { $map: { input: { $ifNull: ["$keywords", []] }, in: { $toLower: "$$this" } } },
            ],
          },
        },
        // Distinct query terms occurring as whole words in the chunk body.
        _textHits: {
          $reduce: {
            input: textRegexes,
            initialValue: 0,
            in: {
              $add: [
                "$$value",
                { $cond: [{ $regexMatch: { input: "$text", regex: "$$this" } }, 1, 0] },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        keywordScore: {
          $add: [
            { $multiply: ["$_keywordHits", KEYWORD_FIELD_WEIGHT] },
            { $multiply: ["$_textHits", TEXT_FIELD_WEIGHT] },
          ],
        },
      },
    },
    { $match: { keywordScore: { $gt: 0 } } },
    // Deterministic ordering: score desc, then a stable tiebreak so equal
    // scores always rank identically across runs.
    { $sort: { keywordScore: -1, lectureId: 1, chunkIndex: 1 } },
    { $limit: limit },
    { $project: { ...PROJECTION, keywordScore: 1 } },
  ]);
};

export default keywordSearch;
