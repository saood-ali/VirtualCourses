import { SchemaType } from "@google/generative-ai";
import { getGenerativeModel } from "../providers/geminiProvider.js";

// The reranker RANKS ONLY. It never rewrites, summarizes, or generates prose.
// Its entire output is a list of indices into the candidate array, which makes
// the response trivially validatable and impossible to hallucinate text into.

export const RERANK_TOP_N = 4;

// Deterministic ranking: temperature 0 so the same question + chunks yield the
// same ordering. JSON mode with an explicit schema removes any parsing guesswork.
const RERANK_GENERATION_CONFIG = {
  temperature: 0,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      indices: {
        type: SchemaType.ARRAY,
        description:
          "Candidate indices ordered most relevant first. Only indices shown in the candidate list.",
        items: { type: SchemaType.INTEGER },
      },
    },
    required: ["indices"],
  },
};

const RERANK_SYSTEM_INSTRUCTION = `You are a search result reranker for a video lecture platform.

You will receive a STUDENT QUESTION and a numbered list of CANDIDATE transcript excerpts.

Your ONLY job is to decide which excerpts are most likely to contain the information needed to answer the question, and return their indices ordered from most relevant to least relevant.

Rules:
- Return ONLY indices that appear in the candidate list.
- Order them most relevant first.
- Never return an index twice.
- Do NOT rewrite, summarize, translate, or quote the excerpt text.
- Do NOT answer the student's question.
- Judge relevance by whether the excerpt helps answer the question, not by how well written it is.
- If fewer excerpts are relevant than requested, return only the relevant ones.`;

/**
 * Build the candidate block. Indices are positions in the `chunks` array, so
 * the model never sees or needs database identifiers.
 */
const buildCandidateList = (chunks) =>
  chunks
    .map((chunk, index) => `[${index}]\n${chunk.text}`)
    .join("\n\n---\n\n");

/**
 * Deterministic fallback ordering: keep the retrieval (RRF) order.
 * Used when the model is unavailable or returns nothing usable, so a reranker
 * failure degrades to "retrieval order" rather than failing the request.
 */
const fallbackOrder = (chunks, topN) => chunks.slice(0, topN);

/**
 * Validate and normalize the model's indices against the candidate array.
 * Drops anything out of range, non-integer, or duplicated — a malformed
 * response can therefore never inject or misattribute a chunk.
 */
const sanitizeIndices = (rawIndices, candidateCount, topN) => {
  if (!Array.isArray(rawIndices)) return [];

  const seen = new Set();
  const valid = [];

  for (const raw of rawIndices) {
    const index = Number(raw);
    if (!Number.isInteger(index)) continue;
    if (index < 0 || index >= candidateCount) continue;
    if (seen.has(index)) continue;

    seen.add(index);
    valid.push(index);
    if (valid.length >= topN) break;
  }

  return valid;
};

/**
 * Rerank retrieved chunks with a single Gemini call.
 *
 * Exactly one model call. Reuses the shared provider (no re-instantiation).
 * Chunk objects are returned unmodified — only their order and count change.
 *
 * @param {string} question the student's question (already normalized)
 * @param {Array<object>} chunks RetrievalResult[] from the retrieval pipeline
 * @param {{ topN?: number }} [options]
 * @returns {Promise<Array<object>>} up to topN chunks, most relevant first
 */
export const rerankChunks = async (question, chunks, options = {}) => {
  const { topN = RERANK_TOP_N } = options;

  if (!Array.isArray(chunks) || chunks.length === 0) return [];
  // Nothing to rank — skip the call entirely rather than spend a request.
  if (chunks.length <= 1) return chunks.slice(0, topN);

  try {
    const model = getGenerativeModel();

    const prompt = `STUDENT QUESTION:
${question}

CANDIDATE EXCERPTS:
${buildCandidateList(chunks)}

Return the indices of the ${topN} most relevant excerpts, most relevant first.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: RERANK_SYSTEM_INSTRUCTION,
      generationConfig: RERANK_GENERATION_CONFIG,
    });

    const parsed = JSON.parse(result.response.text());
    const indices = sanitizeIndices(parsed?.indices, chunks.length, topN);

    if (indices.length === 0) {
      console.warn("[Rerank] Model returned no usable indices — falling back to retrieval order.");
      return fallbackOrder(chunks, topN);
    }

    console.log(`[Rerank] ${chunks.length} candidate(s) -> ${indices.length}, order: [${indices.join(", ")}]`);
    return indices.map((index) => chunks[index]);
  } catch (error) {
    // A reranking failure must not fail the request; retrieval order is a
    // reasonable, already-relevance-sorted fallback.
    console.error("[Rerank] FAILED, falling back to retrieval order:", error.message);
    return fallbackOrder(chunks, topN);
  }
};

export default rerankChunks;
