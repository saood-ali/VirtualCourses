// Deterministic keyword extraction for LectureChunk.keywords.
//
// No LLM, no embeddings, no external NLP dependency. Same text always yields
// the same keywords, in the same order.
//
// IMPORTANT — this module owns the ONE tokenizer shared by ingestion and
// retrieval. `keywordSearch` matches stored keywords against query terms with
// `$in`, which is an exact string comparison: if the two sides tokenized
// differently (different stopwords, casing, or punctuation handling), the
// query would silently match nothing. `queryPreprocessor.extractKeywordTerms`
// therefore tokenizes through `tokenize()` below rather than reimplementing it.

// Stopwords: high-frequency English function words plus lecture-delivery
// filler ("okay", "basically", "actually"). These would otherwise dominate a
// frequency ranking while carrying no retrieval signal.
export const STOPWORDS = new Set([
  // articles / conjunctions / prepositions
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor",
  "of", "off", "on", "onto", "or", "out", "over", "per", "than", "the", "to",
  "up", "via", "with", "within", "without", "about", "above", "across",
  "after", "against", "along", "among", "around", "before", "behind", "below",
  "beneath", "beside", "between", "beyond", "during", "except", "inside",
  "near", "since", "through", "toward", "under", "until", "upon", "while",
  // pronouns / determiners
  "all", "another", "any", "anyone", "anything", "both", "each", "either",
  "enough", "every", "everyone", "everything", "few", "he", "her", "hers",
  "herself", "him", "himself", "his", "i", "it", "its", "itself", "many", "me",
  "mine", "more", "most", "much", "my", "myself", "neither", "no", "none",
  "nothing", "one", "other", "others", "our", "ours", "ourselves", "same",
  "several", "she", "some", "someone", "something", "such", "that", "their",
  "theirs", "them", "themselves", "these", "they", "this", "those", "us",
  "we", "what", "whatever", "which", "who", "whoever", "whom", "whose", "you",
  "your", "yours", "yourself",
  // verbs / modals with no topical content
  "am", "are", "be", "been", "being", "can", "could", "did", "do", "does",
  "doing", "done", "had", "has", "have", "having", "is", "may", "might",
  "must", "shall", "should", "was", "were", "will", "would",
  // adverbs / discourse markers / lecture filler
  "again", "already", "also", "always", "actually", "basically", "because",
  "essentially", "even", "ever", "here", "how", "however", "just", "let",
  "like", "literally", "maybe", "not", "now", "obviously", "often", "okay",
  "only", "perhaps", "probably", "quite", "rather", "really", "right", "so",
  "sometimes", "still", "sure", "then", "there", "therefore", "thus", "too",
  "very", "well", "when", "where", "whether", "why", "yes", "yet",
  // generic teaching verbs/nouns that appear in nearly every lecture
  "back", "called", "come", "comes", "get", "gets", "getting", "give", "go",
  "going", "gone", "look", "looks", "make", "makes", "making", "mean", "means",
  "need", "needs", "put", "said", "say", "says", "see", "start", "started",
  "take", "takes", "talk", "talking", "tell", "thing", "things", "think",
  "today", "use", "used", "uses", "using", "want", "way", "ways", "went",
  "lecture", "lectures", "video", "course", "chapter", "example", "examples",
]);

// Tokens shorter than this carry too little signal to index.
export const MIN_TOKEN_LENGTH = 3;

// Keywords stored per chunk. Enough to characterize a ~500-token chunk without
// bloating the document or diluting the match score.
export const MAX_KEYWORDS_PER_CHUNK = 15;

/**
 * Normalize a single raw token.
 * Lowercases, strips surrounding punctuation, and preserves internal dots,
 * hyphens, and underscores so technical vocabulary survives intact
 * (node.js, array.map, snake_case, flex-direction).
 *
 * Returns "" for anything that should not be indexed.
 *
 * @param {string} raw
 * @returns {string} normalized token, or "" to discard
 */
export const normalizeToken = (raw) => {
  const token = String(raw)
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, "") // leading punctuation / quotes / brackets
    .replace(/[^a-z0-9]+$/, ""); // trailing punctuation

  if (token.length < MIN_TOKEN_LENGTH) return "";
  if (STOPWORDS.has(token)) return "";
  // Pure numbers ("2024", "42") are not useful retrieval keys.
  if (/^\d+$/.test(token)) return "";

  return token;
};

/**
 * Tokenize text into normalized, indexable tokens (duplicates preserved, so
 * callers can compute frequency).
 *
 * This is the single shared tokenizer — retrieval calls it too, which is what
 * guarantees stored keywords and query terms are directly `$in`-comparable.
 *
 * @param {string} text
 * @returns {string[]}
 */
export const tokenize = (text) => {
  if (!text || typeof text !== "string") return [];

  const tokens = [];
  for (const raw of text.split(/\s+/)) {
    const token = normalizeToken(raw);
    if (token) tokens.push(token);
  }
  return tokens;
};

/**
 * Extract ranked keywords from a chunk of text.
 *
 * Ranking is pure term frequency, with an alphabetical tiebreak so equal
 * counts always order identically. Fully deterministic — no AI, no network.
 *
 * @param {string} text chunk text
 * @param {number} [limit=MAX_KEYWORDS_PER_CHUNK]
 * @returns {string[]} distinct keywords, most frequent first
 */
export const extractKeywords = (text, limit = MAX_KEYWORDS_PER_CHUNK) => {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const frequency = new Map();
  for (const token of tokens) {
    frequency.set(token, (frequency.get(token) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
};

export default extractKeywords;
