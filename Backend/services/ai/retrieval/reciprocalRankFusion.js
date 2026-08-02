// Reciprocal Rank Fusion — standard formulation.
//
//   score(doc) = SUM over each result list containing doc of 1 / (k + rank)
//
// rank is 1-based. Documents absent from a list contribute nothing. RRF fuses
// on RANK ONLY, so raw vector similarity and keyword counts never need to be
// normalized against each other.
//
// Input and output are both RetrievalResult[]. This stage updates ONLY
// rrfScore; vectorScore and keywordScore are carried through untouched from
// whichever arm produced them.

export const RRF_K = 60;

/**
 * Fuse ranked RetrievalResult lists with Reciprocal Rank Fusion.
 *
 * @param {Array<Array<object>>} rankedLists ordered RetrievalResult lists,
 *   best result first
 * @param {{ k?: number, limit?: number }} options
 * @returns {Array<object>} RetrievalResult[] sorted by rrfScore descending
 */
export const reciprocalRankFusion = (rankedLists, options = {}) => {
  const { k = RRF_K, limit = 12 } = options;

  const fused = new Map();

  for (const list of rankedLists) {
    if (!Array.isArray(list)) continue;

    list.forEach((result, index) => {
      const id = result?.chunkId;
      if (!id) return;

      const rank = index + 1; // 1-based
      const contribution = 1 / (k + rank);

      const existing = fused.get(id);
      if (existing) {
        // Same chunk from another arm: accumulate rrfScore and adopt the
        // non-zero score that arm contributed (e.g. keywordScore onto a chunk
        // first seen in the vector arm). Identity fields are identical.
        existing.rrfScore += contribution;
        if (result.vectorScore) existing.vectorScore = result.vectorScore;
        if (result.keywordScore) existing.keywordScore = result.keywordScore;
      } else {
        fused.set(id, { ...result, rrfScore: contribution });
      }
    });
  }

  return Array.from(fused.values())
    // Deterministic tiebreak so equal RRF scores always order identically.
    .sort(
      (a, b) =>
        b.rrfScore - a.rrfScore ||
        a.lectureId.localeCompare(b.lectureId) ||
        a.chunkIndex - b.chunkIndex
    )
    .slice(0, limit);
};

export default reciprocalRankFusion;
