import { estimateTokens } from "./tokenEstimator.js";
import { CHUNKING_CONFIG } from "./chunkingConfig.js";

// Deterministic semantic chunking. No LLM, no classification.
//
// A new chunk starts when EITHER:
//   - a topic boundary is detected (paragraph break or heading-like line), or
//   - the token budget would be exceeded.
// Sentences are never split mid-sentence, and ~OVERLAP_TOKENS of trailing
// whole-sentence context is carried into the next chunk for retrieval quality.
const { TARGET_TOKENS, MAX_TOKENS, MIN_TOKENS, OVERLAP_TOKENS } = CHUNKING_CONFIG;

// Build the overlap prefix by taking whole sentences from the end of the
// previous chunk until ~OVERLAP_TOKENS is reached. Whole sentences only.
const buildOverlap = (sentences) => {
  const overlap = [];
  let tokens = 0;
  for (let i = sentences.length - 1; i >= 0; i--) {
    const t = estimateTokens(sentences[i]);
    if (tokens + t > OVERLAP_TOKENS && overlap.length > 0) break;
    overlap.unshift(sentences[i]);
    tokens += t;
    if (tokens >= OVERLAP_TOKENS) break;
  }
  return overlap;
};

/**
 * @param {({ text: string, breakBefore?: boolean }|string)[]} segments
 *   Ordered transcript segments. Plain strings are accepted for backward
 *   compatibility (treated as having no topic break).
 * @returns {{ text: string, tokenCount: number }[]} ordered chunks
 */
export const chunkSentences = (segments) => {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  // Normalize input to { text, breakBefore } shape.
  const items = segments.map((s) =>
    typeof s === "string" ? { text: s, breakBefore: false } : { text: s.text, breakBefore: !!s.breakBefore }
  );

  const chunks = [];
  let current = []; // sentences in the chunk being built
  let currentTokens = 0;

  const flush = () => {
    if (current.length === 0) return;
    const text = current.join(" ");
    chunks.push({ text, tokenCount: estimateTokens(text) });
  };

  const closeChunkWithOverlap = () => {
    flush();
    const overlap = buildOverlap(current);
    current = [...overlap];
    currentTokens = overlap.reduce((sum, s) => sum + estimateTokens(s), 0);
  };

  for (const item of items) {
    const sentence = item.text;
    const sentenceTokens = estimateTokens(sentence);

    // Topic boundary: start a new chunk if the current one is already
    // substantial enough (>= MIN_TOKENS). Tiny chunks are not forced open,
    // which prevents heading spam from producing many undersized chunks.
    if (item.breakBefore && currentTokens >= MIN_TOKENS) {
      closeChunkWithOverlap();
    }

    // Token ceiling: adding this sentence would exceed MAX_TOKENS.
    if (current.length > 0 && currentTokens + sentenceTokens > MAX_TOKENS) {
      closeChunkWithOverlap();
    }

    current.push(sentence);
    currentTokens += sentenceTokens;

    // Reached the soft target within bounds -> close the chunk and seed overlap.
    if (currentTokens >= TARGET_TOKENS) {
      closeChunkWithOverlap();
    }
  }

  // Flush the remainder. If it is only leftover overlap (already emitted) skip it;
  // otherwise merge tiny tails into the previous chunk when below the minimum.
  if (current.length > 0) {
    const tailText = current.join(" ");
    const tailTokens = estimateTokens(tailText);
    const isOnlyOverlap = chunks.length > 0 && tailTokens <= OVERLAP_TOKENS + 5;

    if (!isOnlyOverlap) {
      if (chunks.length > 0 && tailTokens < MIN_TOKENS) {
        const prev = chunks[chunks.length - 1];
        const mergedTokens = prev.tokenCount + tailTokens;
        if (mergedTokens <= MAX_TOKENS) {
          prev.text = `${prev.text} ${tailText}`;
          prev.tokenCount = estimateTokens(prev.text);
        } else {
          chunks.push({ text: tailText, tokenCount: tailTokens });
        }
      } else {
        chunks.push({ text: tailText, tokenCount: tailTokens });
      }
    }
  }

  return chunks;
};

export default chunkSentences;
