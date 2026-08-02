// Deterministic query preprocessing for the retrieval engine.
// No LLM, no rewriting, no expansion, no summarization. Same input always
// produces the same output.

// Very small, fixed English stopword list. Only used to drop terms that would
// match nearly every chunk in the keyword arm. It never rewrites the query that
// gets embedded.
const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did", "do",
  "does", "for", "from", "had", "has", "have", "how", "i", "in", "is", "it",
  "its", "me", "of", "on", "or", "that", "the", "then", "there", "these",
  "this", "to", "was", "were", "what", "when", "where", "which", "who", "why",
  "will", "with", "you", "your",
]);

// Terms shorter than this are dropped from the keyword arm (they carry almost
// no selectivity). The embedded query is unaffected.
const MIN_TERM_LENGTH = 2;

// Upper bound on keyword terms sent to MongoDB, so a pathological query cannot
// build an unbounded aggregation pipeline.
const MAX_TERMS = 24;

/**
 * Normalize a raw user question.
 * Allowed operations only: normalize line endings, collapse repeated
 * whitespace, trim. The text is otherwise returned verbatim.
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
 * Lowercased, punctuation-stripped, de-duplicated, order preserved.
 *
 * Dotted/technical tokens are preserved (node.js, array.map) because the
 * transcripts they must match keep that vocabulary verbatim.
 *
 * @param {string} normalizedQuery
 * @returns {string[]}
 */
export const extractKeywordTerms = (normalizedQuery) => {
  if (!normalizedQuery) return [];

  const terms = [];
  const seen = new Set();

  for (const rawToken of normalizedQuery.split(" ")) {
    const token = rawToken
      .toLowerCase()
      // strip leading/trailing punctuation but keep internal . _ - and digits
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    if (!token) continue;
    if (token.length < MIN_TERM_LENGTH) continue;
    if (STOPWORDS.has(token)) continue;
    if (seen.has(token)) continue;

    seen.add(token);
    terms.push(token);
    if (terms.length >= MAX_TERMS) break;
  }

  return terms;
};

export default normalizeQuery;
