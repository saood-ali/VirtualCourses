import { normalizeQuery, extractKeywordTerms } from "./queryPreprocessor.js";
import { embedQuery, vectorSearch } from "./vectorSearch.js";
import { keywordSearch } from "./keywordSearch.js";
import { reciprocalRankFusion, RRF_K } from "./reciprocalRankFusion.js";

// Retrieval depth per arm, and the final fused result size.
export const VECTOR_CANDIDATES = 20;
export const KEYWORD_CANDIDATES = 20;
export const FINAL_TOP_K = 12;

// Explicit output shape. Guarantees `embedding` can never leak, regardless of
// what the underlying stages project.
const shapeChunk = (doc) => ({
  chunkId: String(doc._id),
  lectureId: String(doc.lectureId),
  courseId: String(doc.courseId),
  chunkIndex: doc.chunkIndex,
  text: doc.text,
  startTimestamp: doc.startTimestamp ?? 0,
  endTimestamp: doc.endTimestamp ?? 0,
  vectorScore: typeof doc.vectorScore === "number" ? doc.vectorScore : null,
  keywordScore: typeof doc.keywordScore === "number" ? doc.keywordScore : 0,
  rrfScore: doc.rrfScore,
});

/**
 * Hybrid retrieval: vector search + keyword search fused with RRF.
 *
 * Question -> normalize -> embed -> (vector | keyword) -> RRF -> top 12 chunks.
 *
 * Retrieval only. This never calls Gemini for answers, never builds a prompt,
 * and never reranks with an LLM.
 *
 * @param {string} question raw user question
 * @param {{ lectureId?: string, courseId?: string, limit?: number }} options
 *   lectureId / courseId are applied inside the Atlas query and the keyword
 *   `$match`, not as a post-retrieval filter.
 * @returns {Promise<{ query: string, terms: string[], chunks: Array<object>,
 *   stats: object }>}
 */
export const retrieveChunks = async (question, options = {}) => {
  const { lectureId, courseId, limit = FINAL_TOP_K } = options;

  // Step 1 — deterministic normalization.
  const query = normalizeQuery(question);
  if (!query) {
    return {
      query: "",
      terms: [],
      chunks: [],
      stats: { vectorCount: 0, keywordCount: 0, fusedCount: 0, k: RRF_K },
    };
  }

  const terms = extractKeywordTerms(query);

  // Step 2 — embed the query with the same model used for chunk embeddings.
  const queryEmbedding = await embedQuery(query);

  // Step 3 — run both arms concurrently. They are independent queries; no
  // duplicate work between them.
  const scope = { lectureId, courseId };
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(queryEmbedding, { ...scope, limit: VECTOR_CANDIDATES }),
    keywordSearch(terms, { ...scope, limit: KEYWORD_CANDIDATES }),
  ]);

  // Step 4 — fuse by rank and truncate to the final top K.
  const fused = reciprocalRankFusion([vectorResults, keywordResults], {
    k: RRF_K,
    limit,
  });

  console.log(
    `[Retrieval] "${query.slice(0, 80)}" — vector: ${vectorResults.length}, ` +
      `keyword: ${keywordResults.length}, fused: ${fused.length}`
  );

  return {
    query,
    terms,
    chunks: fused.map(shapeChunk),
    stats: {
      vectorCount: vectorResults.length,
      keywordCount: keywordResults.length,
      fusedCount: fused.length,
      k: RRF_K,
    },
  };
};

export default retrieveChunks;
