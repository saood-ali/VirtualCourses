// Tunable chunking parameters, extracted so they can be adjusted without
// touching the chunking algorithm. All values are token counts.
export const CHUNKING_CONFIG = {
  TARGET_TOKENS: 500, // soft target per chunk
  MAX_TOKENS: 650, // hard ceiling — never exceed
  MIN_TOKENS: 250, // avoid tiny trailing chunks where possible
  OVERLAP_TOKENS: 50, // approximate context copied between consecutive chunks
};

export default CHUNKING_CONFIG;
