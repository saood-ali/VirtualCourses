import { getEncoding } from "js-tiktoken";

// Deterministic tokenizer using tiktoken's cl100k_base encoding.
// This is exact and reproducible (no LLM call, no network) — accurate token
// counts keep chunk sizes consistent, which the retrieval pipeline depends on.
// The encoder is created once and reused.
let encoder = null;

const getEncoder = () => {
  if (!encoder) encoder = getEncoding("cl100k_base");
  return encoder;
};

export const estimateTokens = (text) => {
  if (!text) return 0;
  const normalized = text.trim();
  if (!normalized) return 0;
  try {
    return getEncoder().encode(normalized).length;
  } catch (error) {
    // Defensive fallback: if encoding ever fails, degrade to a rough estimate
    // rather than throwing inside the ingestion pipeline.
    console.error("[TokenEstimator] Encoding failed, using length heuristic:", error.message);
    return Math.ceil(normalized.length / 4);
  }
};

export default estimateTokens;
