import { SchemaType } from "@google/generative-ai";
import { getGenerativeModel } from "../providers/geminiProvider.js";

// Answer generation: ONE model call that produces the answer text AND the
// source mapping in a single structured response. The generator never reasons
// about timestamps — it returns chunk indices, and the service attaches the
// timestamps that already exist on the retrieved chunks (frozen decision:
// more reliable and less hallucination-prone than asking the model for times).

const GENERATION_CONFIG = {
  temperature: 0,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      answer: {
        type: SchemaType.STRING,
        description: "The answer to the student's question, using ONLY the provided context.",
      },
      sourceIndices: {
        type: SchemaType.ARRAY,
        description:
          "Indices of the context excerpts that were actually used. Only indices from the provided list.",
        items: { type: SchemaType.INTEGER },
      },
    },
    required: ["answer", "sourceIndices"],
  },
};

const SYSTEM_INSTRUCTION = `You are an AI tutor for an online video lecture platform.

You will receive a STUDENT QUESTION and a CONTEXT made of numbered excerpts from the lecture transcript.

Answer the question using ONLY the provided context.

Rules:
- NEVER invent facts, figures, or claims that are not present in the context.
- NEVER use outside knowledge or general knowledge. If the context does not contain the answer, say so.
- If the question cannot be answered from the provided context, respond with a polite message explaining that the lecture does not contain enough information to answer the question. Do NOT guess.
- Keep the answer concise and clear.
- Do NOT mention "the context", "the lecture transcript", or "provided excerpts" in your answer.
- sourceIndices must list only the excerpts you actually used, and only indices that appear in the provided list.`;

const CONTEXT_MISSING_MESSAGE =
  "I couldn't find enough information in this lecture to answer that question. Try asking about something covered in the current lecture.";

const buildContextBlock = (chunks) =>
  chunks
    .map((chunk, index) => `[${index}]\n${chunk.text}`)
    .join("\n\n---\n\n");

/**
 * Parse and validate the structured response.
 * Returns null on malformed output (no retry — we only allow one generation call).
 */
const parseStructuredResponse = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
  const sourceIndices = Array.isArray(parsed?.sourceIndices) ? parsed.sourceIndices : [];
  if (!answer) return null;

  return { answer, sourceIndices };
};

/**
 * Validate source indices against the provided chunks.
 * Out-of-range, non-integer, or duplicate indices are dropped; a malformed
 * response can never cite a chunk that was not provided.
 */
const resolveSourceIndices = (rawIndices, chunkCount) => {
  const seen = new Set();
  const indices = [];

  for (const raw of rawIndices) {
    const index = Number(raw);
    if (!Number.isInteger(index)) continue;
    if (index < 0 || index >= chunkCount) continue;
    if (seen.has(index)) continue;

    seen.add(index);
    indices.push(index);
  }

  return indices;
};

/**
 * Generate an answer from reranked chunks with exactly ONE Gemini call.
 *
 * The model returns answer text plus the indices of the excerpts it used.
 * Timestamps are then attached from the chunk documents themselves (never
 * inferred by the model). `embedding` can never leak: the chunks are
 * RetrievalResults, which do not carry it.
 *
 * @param {string} question the student's question (already normalized)
 * @param {Array<object>} chunks reranked RetrievalResult[] (top 4)
 * @returns {Promise<{ answer: string, sources: Array<object> }>}
 */
export const generateAnswer = async (question, chunks) => {
  const safeChunks = Array.isArray(chunks) ? chunks : [];
  const sourceChunks = safeChunks.slice(0, 4);

  // Nothing to answer from — return the polite not-enough-information message.
  if (sourceChunks.length === 0) {
    return { answer: CONTEXT_MISSING_MESSAGE, sources: [] };
  }

  try {
    const model = getGenerativeModel();

    const prompt = `STUDENT QUESTION:
${question}

CONTEXT (numbered excerpts from the lecture transcript):
${buildContextBlock(sourceChunks)}

Answer the question using ONLY the context above.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: GENERATION_CONFIG,
    });

    const parsed = parseStructuredResponse(result.response.text());
    if (!parsed) {
      throw new Error("Malformed structured response from the model.");
    }

    const indices = resolveSourceIndices(parsed.sourceIndices, sourceChunks.length);

    const sources = indices.map((index) => {
      const chunk = sourceChunks[index];
      return {
        chunkIndex: chunk.chunkIndex,
        startTimestamp: chunk.startTimestamp ?? 0,
        endTimestamp: chunk.endTimestamp ?? 0,
      };
    });

    return { answer: parsed.answer, sources };
  } catch (error) {
    console.error("[AnswerGeneration] FAILED:", error.message);
    // A generation failure must degrade gracefully rather than expose an error.
    return { answer: CONTEXT_MISSING_MESSAGE, sources: [] };
  }
};

export default generateAnswer;
