<div align="center">

# AI Pipeline

### How lecture video becomes queryable knowledge — and how questions become grounded answers.

**[README](../README.md)** · **[Features](FEATURES.md)** · **[Architecture](ARCHITECTURE.md)**

</div>

---

## Models and the Provider Layer

All Gemini access is centralized in [geminiProvider.js](../Backend/services/ai/providers/geminiProvider.js), which exports one shared client, one file manager, and the frozen embedding constants.

| Concern | Model | Configuration |
| :--- | :--- | :--- |
| **Transcription** | `GEMINI_MODEL` (env) | Gemini File API upload → bounded polling → verbatim prompt |
| **Embeddings** | `gemini-embedding-001` | **Hardcoded constant.** 3072 dimensions, batched 100 per request |
| **Reranking** | `GEMINI_MODEL` (env) | `temperature: 0`, `responseSchema`-constrained JSON |
| **Answer generation** | `GEMINI_MODEL` (env) | `temperature: 0`, JSON schema, context-restricted system prompt |
| **Search classification** | `GEMINI_MODEL` (env) | Constrained to a fixed category taxonomy, not free text |

> [!IMPORTANT]
> `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS = 3072` are **code constants, not environment variables.** Vectors from different models are not comparable and the Atlas index declares a fixed `numDimensions`, so changing either through config would produce silently meaningless results with no runtime error. As constants, the required migration — re-embed everything, recreate the index — is forced through review.

---

## Ingestion — Video to Retrievable Knowledge

Background, fire-and-forget, idempotent. Orchestrated by [lecturePipeline.js](../Backend/services/ai/ingestion/lecturePipeline.js), which sequences the stages and owns the `READY` transition.

```
UPLOADED  →  TRANSCRIBING  →  CHUNKING  →  EMBEDDING  →  INDEXING  →  READY
                                                                   (or FAILED)
```

| Stage | What happens |
| :--- | :--- |
| **Trigger** | On video attach the lecture is marked `UPLOADED` and the pipeline is invoked **without blocking the API response**. |
| **Transcription** | Video is streamed to a temp file, uploaded to Gemini's File API, polled until processed (`GEMINI_MAX_POLL_ATTEMPTS`, default 60 × 2 s ≈ 2 min), and transcribed with a verbatim prompt. **Existing transcripts are never regenerated.** Temp files are removed in `finally`; the remote Gemini file is deleted afterward. |
| **Chunking** | **No LLM.** The transcript is deterministically normalized, then split by a custom sentence splitter preserving abbreviations, decimals, and dotted code syntax (`Node.js`, `array.map`, `Ph.D.`, `3.14`). Chunks target ~500 tokens (ceiling 650, minimum 250), never split mid-sentence, and carry ~50 tokens of whole-sentence overlap forward. Counts come from real `cl100k_base` tiktoken encoding with a cached encoder. Top-15 term-frequency keywords per chunk power the lexical arm, using a stopword list tuned for lecture filler. |
| **Embedding** | Each chunk is embedded with `gemini-embedding-001` (3072 dims) in **batches of 100**, written with a single `bulkWrite`. Idempotent — chunks already carrying a correctly-sized vector are skipped. |
| **Indexing** | Polls Atlas with one of the lecture's **own** embeddings, scoped to its own `lectureId`, until the index serves it — then sets `READY`. On timeout (`ATLAS_INDEX_TIMEOUT_MS`, default 90 s) the lecture is still marked `READY` — keyword search works — and the UI reads true state from `status` / `chunkCount`. |

---

## Retrieval and Generation — Per Student Question

**Exactly two Gemini calls per question.** Everything else — normalization, retrieval, fusion, source mapping — is deterministic.

```
question → normalize → embed → ┌─ vector search ─┐ → RRF (k=60) → rerank → generate → map sources
                               └─ keyword search ┘    top 12       12→4      LLM #2     server-side
                                    concurrent                     LLM #1
```

| Step | What happens |
| :--- | :--- |
| **1 · Normalize** | The question is whitespace-normalized; keyword terms are extracted through the **shared tokenizer** and capped at 24. |
| **2 · Embed** | The query is embedded with **the same model used for the chunks** — non-negotiable. |
| **3 · Dual retrieval** | Vector search (`$vectorSearch`, cosine, `numCandidates` = 10 × limit, `lectureId`/`courseId` as Atlas `filter`s, `embedding` excluded from projection) and keyword search (`$in` over stored keywords, scored by distinct term matches) run **concurrently**. |
| **4 · Fusion** | Reciprocal Rank Fusion (`k = 60`) merges both lists **by rank** into the top 12 — scores never need cross-modal normalization. |
| **5 · Rerank** *(LLM call #1)* | One Gemini call ranks 12 candidates down to 4 at temperature 0 under a JSON schema, indices validated against the candidate list. Failure falls back to retrieval order. |
| **6 · Generate** *(LLM call #2)* | One Gemini call with a system prompt restricting answers to the provided context, returning `{ answer, usedIndices }`. Failure returns "not enough information". |
| **7 · Source mapping** | Timestamps are attached **from the chunk documents themselves**, never inferred by the model. Malformed or out-of-range indices are dropped. |
| **8 · Response** | `{ answer, sources }` is returned. **No embeddings, raw scores, or internal structures reach the client.** |

---

## Search Pipeline — Cheap Path First

Course search deliberately spends nothing on the common case: a regex match across course fields returns results at **zero tokens**, and only a miss escalates to Gemini classification onto the fixed category taxonomy before retrying the query. Constraining the classifier to that taxonomy means its output is **always something the catalog can match**, never arbitrary text.

---

## Data Model for Retrieval

`LectureChunk` is the retrieval unit — **text, vector, and lexical index in one document**, so embeddings live in the same store as the text they came from and there is no second database to operate.

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `lectureId`, `courseId` | `ObjectId` (ref) | Retrieval scoping — declared as Atlas `filter` fields |
| `chunkIndex` | `Number` | Stored order within a lecture |
| `text` | `String` | The chunk passed to the model as context |
| `keywords` | `[String]` | Top 15 terms — the lexical retrieval arm |
| `embedding` | `[Number]` | 3072-dim vector; **excluded from every retrieval projection** |
| `tokenCount` | `Number` | Exact tiktoken count for budget accounting |
| `startTimestamp`, `endTimestamp`, `duration` | `Number` | Reserved — currently `0`; per-chunk timing is in the improvement backlog |

**Indexes** — `{ lectureId: 1, chunkIndex: 1 }` for ordered retrieval, `{ courseId: 1 }` for course scoping, plus the Atlas Vector Search index in [atlas-vector-index.json](atlas-vector-index.json): a `vector` field on `embedding` (3072 dims, cosine) with `filter` fields on `courseId` and `lectureId`.

> [!WARNING]
> This index is created **manually** in the Atlas UI or Admin API — never from application code. `numDimensions` must stay `3072` to match `EMBEDDING_DIMENSIONS`.

---

## Resilience

Every AI boundary has an explicit fallback. **No dependency failure returns a 500.**

| Failure | Fallback |
| :--- | :--- |
| Redis unavailable or throwing | Read directly from MongoDB |
| Reranker call fails | Use retrieval (RRF) order |
| Reranker returns invalid indices | Discard them; keep the valid subset |
| Answer generation fails | Return an explicit "not enough information" response |
| Atlas vector index not ready | Keyword arm still serves results |
| Lecture not yet ingested | Report "still processing" rather than answering from nothing |
| Question outside the lecture | Say so, instead of answering from general knowledge |

---

<div align="center">

**[Back to README](../README.md)** · **[Architecture](ARCHITECTURE.md)**

</div>
