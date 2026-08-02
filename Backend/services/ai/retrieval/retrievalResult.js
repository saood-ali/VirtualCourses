// RetrievalResult — the single internal structure every retrieval stage
// produces and consumes.
//
// vectorSearch and keywordSearch both emit this exact shape, setting the
// score they did not compute to 0. reciprocalRankFusion only ever updates
// rrfScore. Downstream stages (Milestone 5) can therefore treat any retrieval
// arm interchangeably.
//
// {
//   lectureId, courseId, chunkId, chunkIndex, text,
//   startTimestamp, endTimestamp,
//   vectorScore, keywordScore, rrfScore
// }

// Fields read from LectureChunk by the search stages.
// `embedding` is deliberately absent — vectors never leave MongoDB, so no
// downstream stage is able to leak them.
export const RETRIEVAL_PROJECTION = {
  _id: 1,
  lectureId: 1,
  courseId: 1,
  chunkIndex: 1,
  text: 1,
  startTimestamp: 1,
  endTimestamp: 1,
};

/**
 * Build a RetrievalResult from a projected LectureChunk document.
 * ObjectIds are stringified so the shape is JSON-safe and identity
 * comparisons in fusion are plain string comparisons.
 *
 * @param {object} doc projected LectureChunk document
 * @param {{ vectorScore?: number, keywordScore?: number, rrfScore?: number }} scores
 * @returns {object} RetrievalResult
 */
export const createRetrievalResult = (doc, scores = {}) => ({
  lectureId: String(doc.lectureId),
  courseId: String(doc.courseId),
  chunkId: String(doc._id ?? doc.chunkId),
  chunkIndex: doc.chunkIndex,
  text: doc.text,
  startTimestamp: doc.startTimestamp ?? 0,
  endTimestamp: doc.endTimestamp ?? 0,
  vectorScore: scores.vectorScore ?? 0,
  keywordScore: scores.keywordScore ?? 0,
  rrfScore: scores.rrfScore ?? 0,
});

export default createRetrievalResult;
