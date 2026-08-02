// Reciprocal Rank Fusion — standard formulation.
//
//   score(doc) = SUM over each result list containing doc of 1 / (k + rank)
//
// rank is 1-based. Documents absent from a list contribute nothing. RRF fuses
// on RANK ONLY, so raw vector similarity and keyword counts never need to be
// normalized against each other.

export const RRF_K = 60;

const identity = (doc) => String(doc._id);

/**
 * Fuse ranked result lists with Reciprocal Rank Fusion.
 *
 * @param {Array<Array<object>>} rankedLists ordered lists, best result first
 * @param {{ k?: number, limit?: number, getId?: (doc: object) => string }} options
 * @returns {Array<object>} fused documents sorted by rrfScore descending
 */
export const reciprocalRankFusion = (rankedLists, options = {}) => {
  const { k = RRF_K, limit = 12, getId = identity } = options;

  const fused = new Map();

  for (const list of rankedLists) {
    if (!Array.isArray(list)) continue;

    list.forEach((doc, index) => {
      const id = getId(doc);
      if (!id) return;

      const rank = index + 1; // 1-based
      const contribution = 1 / (k + rank);

      const existing = fused.get(id);
      if (existing) {
        existing.rrfScore += contribution;
        // Merge fields contributed by the other list (e.g. keywordScore from
        // the keyword arm onto a doc first seen in the vector arm).
        existing.doc = { ...existing.doc, ...doc };
      } else {
        fused.set(id, { doc: { ...doc }, rrfScore: contribution });
      }
    });
  }

  return Array.from(fused.values())
    .map(({ doc, rrfScore }) => ({ ...doc, rrfScore }))
    // Deterministic tiebreak so equal RRF scores always order identically.
    .sort(
      (a, b) =>
        b.rrfScore - a.rrfScore ||
        String(a.lectureId).localeCompare(String(b.lectureId)) ||
        a.chunkIndex - b.chunkIndex
    )
    .slice(0, limit);
};

export default reciprocalRankFusion;
