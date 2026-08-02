// Deterministic query preprocessing for the retrieval engine.
// No LLM, no rewriting, no expansion, no summarization. Same input always
// produces the same output.

import { normalizeToken } from "../ingestion/keywordExtractor.js";

// Upper bound on keyword terms sent to MongoDB, so a pathological query cannot
// build an unbounded $in array.
const MAX_TERMS = 24;

/**
 * Normalize a raw user question.
 * Allowed operations only: normalize line endings, collapse repeated
 * whitespace, trim. The text is otherwise returned verbatim — this is the
 * string that gets embedded, so it must not be altered beyond whitespace.
 *
 * @param {string} raw
 * @returns {string}
 */
export const normalizeQuery = (raw) => {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/\r\n/g, "\n") // Windows line endings
    .replace(/\r/g, "\n") // old Mac line endings
    .replace(/\s+/g, " ") // collapse all runs of whitespace (incl. newlines)
    .trim();
};

/**
 * Extract deterministic keyword terms from a normalized query.
 *
 * Tokenization is delegated to the ingestion keyword extractor so query terms
 * and stored LectureChunk.keywords are produced by exactly the same rules.
 * keywordSearch matches them with `$in` (an exact string comparison), so any
 * divergence between the two would cause silent zero-result queries.
 *
 * @param {string} normalizedQuery
 * @returns {string[]} distinct terms, query order preserved
 */
export const extractKeywordTerms = (normalizedQuery) => {
  if (!normalizedQuery) return [];

  const terms = [];
  const seen = new Set();

  for (const rawToken of normalizedQuery.split(" ")) {
    const token = normalizeToken(rawToken);
    if (!token || seen.has(token)) continue;

    seen.add(token);
    terms.push(token);
    if (terms.length >= MAX_TERMS) break;
  }

  return terms;
};

export default normalizeQuery;
