# AI Pipeline

> Part of the [VirtualCourses](../README.md) documentation. See also:
> [Architecture](ARCHITECTURE.md) · [Performance](PERFORMANCE.md) · [API Reference](API.md) · [Security](SECURITY.md) · [Limitations & Roadmap](ROADMAP.md)

Everything the platform does with Gemini, MongoDB Atlas Vector Search, and tiktoken: the provider layer, the ingestion pipeline that turns a video into retrievable knowledge, the retrieval-and-generation path that answers a student's question, the cheap-path course search, the retrieval data model, and the fallback behaviour at every AI boundary.

---

## 📑 Contents

[Models and the provider layer](#models-and-the-provider-layer) · [Ingestion](#ingestion--video-to-retrievable-knowledge) · [Retrieval and generation](#retrieval-and-generation--per-student-question) · [Search pipeline](#search-pipeline--cheap-path-first) · [Data model for retrieval](#data-model-for-retrieval) · [Resilience](#resilience)

---

## Models and the provider layer

All Gemini access is centralized in [geminiProvider.js](../Backend/services/ai/providers/geminiProvider.js), which exports one shared client, one file manager, and the frozen embedding constants.

| Concern | Model | Configuration |
| :--- | :--- | :--- |
| **Transcription** | `GEMINI_MODEL` (env) | Gemini File API upload → bounded polling → verbatim-transcription prompt |
| **Embeddings** | `gemini-embedding-001` | **Hardcoded constant.** 3072 dimensions, batched 100 per request |
| **Reranking** | `GEMINI_MODEL` (env) | `temperature: 0`, `responseSchema`-constrained JSON |
| **Answer generation** | `GEMINI_MODEL` (env) | `temperature: 0`, JSON schema, context-restricted system prompt |
| **Search classification** | `GEMINI_MODEL` (env) | Constrained to a fixed category taxonomy, not free text |

> [!IMPORTANT]
> `EMBEDDING_MODEL` and `EMBEDDING_DIMENSIONS = 3072` are **deliberately code constants rather than environment variables.** Vectors from different models are not comparable, and the Atlas index declares a fixed `numDimensions`. Changing either through config would produce silently meaningless search results with no runtime error. As constants, the change is forced through review and the required migration — re-embed everything, recreate the index — is explicit.

---

## Ingestion — video to retrievable knowledge

Background, fire-and-forget, idempotent. Orchestrated by [lecturePipeline.js](../Backend/services/ai/ingestion/lecturePipeline.js), which sequences the stages and owns the `READY` transition.

```
     video attached
           │
           ▼
   ┌───────────────┐
   │   UPLOADED    │  API responds immediately — pipeline triggered without await
   └───────┬───────┘
           ▼
   ┌───────────────┐   stream to temp file → Gemini File API → poll until processed
   │ TRANSCRIBING  │   → verbatim transcript.  Existing transcripts never regenerated.
   └───────┬───────┘   temp file removed in `finally`; remote Gemini file deleted
           ▼
   ┌───────────────┐   deterministic normalize → sentence split (abbreviation-safe)
   │   CHUNKING    │   → ~500-token chunks, 650 hard ceiling, 50-token overlap
   └───────┬───────┘   → top-15 term-frequency keywords per chunk.  NO LLM.
           ▼
   ┌───────────────┐   gemini-embedding-001 · 3072 dims · batches of 100
   │  EMBEDDING    │   → single bulkWrite.  Fully embedded lectures skipped.
   └───────┬───────┘
           ▼
   ┌───────────────┐   probe Atlas with one of THIS lecture's own embeddings,
   │   INDEXING    │   scoped to its own lectureId, until the index serves it
   └───────┬───────┘
           ▼
   ┌───────────────┐   provably searchable.  On probe timeout, still READY —
   │     READY     │   keyword retrieval works — and the UI reads the real
   └───────────────┘   state from status + chunkCount.        (or → FAILED)
```

**Stage detail:**

1. **Trigger** — on video attach the lecture is marked `UPLOADED` and the pipeline is invoked without blocking the API response.
2. **Transcription** — the video is streamed to a temp file, uploaded to Gemini's File API, polled until processed (`GEMINI_MAX_POLL_ATTEMPTS`, default 60 × 2 s ≈ 2 min), and transcribed with a verbatim-transcription prompt. Existing transcripts are never regenerated. Temp files are removed in a `finally` block and the remote Gemini file is deleted afterward.
3. **Cleaning & segmentation** — the transcript is deterministically normalized, then split into sentences by a custom splitter that preserves abbreviations, decimals, and dotted code syntax (`Node.js`, `array.map`, `Ph.D.`, `3.14`), tagging paragraph breaks and heading-like lines as topic boundaries.
4. **Semantic chunking** — deterministic, no LLM. Chunks target ~500 tokens (hard ceiling 650, minimum 250), never split mid-sentence, and carry ~50 tokens of whole-sentence overlap into the next chunk so retrieval never loses context at a seam. Tiny tails are merged into the previous chunk. Token counts come from real `cl100k_base` tiktoken encoding, with a cached encoder.
5. **Keyword extraction** — pure term-frequency ranking over the shared tokenizer, with a stopword list tuned for lecture filler ("okay", "basically"). The top 15 keywords per chunk are stored to power the lexical retrieval arm.
6. **Embedding** — each chunk is embedded with `gemini-embedding-001` (3072 dims) in batches of 100 and written with a single `bulkWrite`. Idempotent: chunks already carrying a correctly-sized vector are skipped, so re-running after a partial failure costs nothing for completed work.
7. **Index readiness** — `INDEXING` polls Atlas with one of the lecture's own embeddings, scoped to its own `lectureId`, until the vector index serves it, then sets `READY`. If the index never responds within `ATLAS_INDEX_TIMEOUT_MS` (default 90 s), the lecture is still marked `READY` — keyword search works — and the UI knows the true state via `chunkCount`/status.

---

## Retrieval and generation — per student question

**Exactly two Gemini calls per question.** Everything else is deterministic.

```
  "why does useEffect run twice?"
              │
              ▼
   ┌──────────────────────┐
   │  1. NORMALIZE        │  whitespace-normalize · extract keyword terms
   │                      │  through the SHARED tokenizer (capped at 24)
   └──────────┬───────────┘
              ▼
   ┌──────────────────────┐
   │  2. EMBED QUERY      │  same model as the chunks — non-negotiable
   └──────────┬───────────┘
              │
      ┌───────┴────────┐   ← concurrent (Promise.all)
      ▼                ▼
┌───────────────┐ ┌───────────────┐
│ 3a. VECTOR    │ │ 3b. KEYWORD   │
│ $vectorSearch │ │ $in over      │
│ cosine        │ │ stored        │
│ numCandidates │ │ keywords,     │
│  = 10 × limit │ │ scored by     │
│ lectureId /   │ │ distinct term │
│ courseId as   │ │ matches,      │
│ index FILTERS │ │ deterministic │
│ embedding     │ │ ordering      │
│ EXCLUDED from │ │               │
│ projection    │ │               │
└───────┬───────┘ └───────┬───────┘
        └────────┬────────┘
                 ▼
      ┌────────────────────────┐
      │  4. RRF FUSION         │  score = Σ 1/(60 + rank)
      │     k = 60 → top 12    │  merges by RANK — no score normalization
      └──────────┬─────────────┘
                 ▼
      ┌────────────────────────┐
      │  5. GEMINI RERANK      │  ⟵ LLM call #1
      │     12 → 4             │  temperature 0 · responseSchema
      └──────────┬─────────────┘  indices validated · fails → retrieval order
                 ▼
      ┌────────────────────────┐
      │  6. GEMINI GENERATE    │  ⟵ LLM call #2
      │  { answer,             │  context-restricted system prompt
      │    usedIndices }       │  temperature 0 · JSON schema
      └──────────┬─────────────┘  fails → "not enough information"
                 ▼
      ┌────────────────────────┐
      │  7. SOURCE MAPPING     │  timestamps read from chunk DOCUMENTS —
      │                        │  never inferred by the model.
      └──────────┬─────────────┘  out-of-range indices dropped
                 ▼
         { answer, sources }      no embeddings · no scores · no internals
```

**Step detail:**

1. **Normalize** — the question is whitespace-normalized; keyword terms are extracted through the shared tokenizer and capped at 24 terms.
2. **Embed** — the query is embedded with the same model used for the chunks.
3. **Dual retrieval** — vector search (`$vectorSearch`, `numCandidates` = 10 × limit, cosine, with `lectureId`/`courseId` applied as Atlas `filter`s) and keyword search (`$in` over stored keywords, scored by distinct term matches, deterministically ordered) run concurrently.
4. **Fusion** — Reciprocal Rank Fusion (`k = 60`) merges the two lists by rank into the top 12 chunks; scores never need normalization across modalities.
5. **Rerank** — one Gemini call ranks the 12 candidates down to the top 4 (temperature 0, JSON-schema output, indices validated against the candidate list).
6. **Generate** — one Gemini call with a system prompt restricting answers to the provided context. The model returns answer text plus the indices it used (JSON schema, temperature 0).
7. **Source mapping** — timestamps are attached from the chunk documents themselves, never inferred by the model. Malformed or out-of-range indices are dropped, so sources can only cite chunks that were actually retrieved.
8. **Response** — `{ answer, sources }` is returned. No embeddings, raw scores, or internal structures are exposed to the client.

---

## Search pipeline — cheap path first

Course search deliberately spends nothing on the common case:

```
query → regex match across course fields  ──found──▶ return results   (0 tokens)
              │
           nothing
              ▼
      Gemini classification onto the fixed
      category taxonomy ──▶ retry DB query
```

Constraining the classifier to a fixed taxonomy means its output is always something the catalog can match, and never arbitrary text.

---

## Data model for retrieval

`LectureChunk` is the retrieval unit — text, vector, and lexical index in one document, so embeddings live in the same store as the text they came from and there is no second database to operate.

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `lectureId`, `courseId` | `ObjectId` (ref) | Retrieval scoping — declared as Atlas `filter` fields |
| `chunkIndex` | `Number` | Stored order within a lecture |
| `text` | `String` | The chunk passed to the model as context |
| `keywords` | `[String]` | Top 15 terms — the lexical retrieval arm |
| `embedding` | `[Number]` | 3072-dim vector; **excluded from every retrieval projection** |
| `tokenCount` | `Number` | Exact tiktoken count for budget accounting |
| `startTimestamp`, `endTimestamp`, `duration` | `Number` | Reserved — currently `0`, see [Known Limitations](ROADMAP.md#-known-limitations) |

**Indexes:** `{ lectureId: 1, chunkIndex: 1 }` for ordered retrieval, `{ courseId: 1 }` for course scoping, plus the Atlas Vector Search index defined in [atlas-vector-index.json](atlas-vector-index.json).

```jsonc
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 3072, "similarity": "cosine" },
    { "type": "filter", "path": "courseId" },
    { "type": "filter", "path": "lectureId" }
  ]
}
```

> [!WARNING]
> This index is created **manually** in the Atlas UI or Admin API — never from application code. `numDimensions` must stay `3072` to match `EMBEDDING_DIMENSIONS`.

---

## Resilience

Every AI boundary has an explicit fallback. No dependency failure returns a 500.

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

[← Back to the README](../README.md)
