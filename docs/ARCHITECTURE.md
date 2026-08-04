<div align="center">

# Architecture

### The design decisions behind the system — why each one exists, not just what it does.

**[README](../README.md)** · **[Features](FEATURES.md)** · **[AI Pipeline](AI_PIPELINE.md)**

</div>

---

## Why This Project Exists

Each constraint below is a real failure mode that shaped a specific design decision in this codebase.

| # | Constraint | Mechanism that prevents it |
| :-: | :--- | :--- |
| **1** | **Video lectures are unstructured data.** A 40-minute lecture cannot be searched, quoted, or reasoned over. A stuck student either scrubs the timeline or leaves. | An ingestion pipeline converts every upload into structured knowledge — transcription, deterministic chunking, 3072-dim embeddings, Atlas Vector Search index. No manual step. |
| **2** | **Traditional search cannot understand learning intent.** A student's phrasing and a course's taxonomy rarely share vocabulary. | Cheap regex pass first; only on zero results does Gemini map the query onto the fixed category taxonomy. The common case costs zero tokens. |
| **3** | **Pure vector search is confidently wrong on exact terms.** Ask about `useEffect` and cosine similarity returns lifecycle methods in general. | Hybrid retrieval — vector and keyword search run concurrently, fused by Reciprocal Rank Fusion, which merges by *rank* so incomparable scores need no normalization. |
| **4** | **Retrieval alone is not precision.** Twelve fused candidates still hold near-misses, and stuffing all twelve dilutes the answer. | A Gemini reranking pass cuts 12 → 4, schema-constrained at temperature 0, indices validated. On failure, retrieval order is used as-is. |
| **5** | **An LLM will cite a timestamp it invented.** Asked for citations, it produces plausible ones whether or not they exist. | The model returns *indices only*. Timestamps come from the chunk documents server-side; out-of-range indices are dropped. |
| **6** | **"Ready" that isn't ready is a silent failure.** Atlas indexes build asynchronously — a UI saying ready with a search returning nothing, and no error anywhere. | An `INDEXING` stage probes the live index with one of the lecture's own embeddings before setting `READY`. |
| **7** | **Transcription takes minutes; HTTP requests do not.** Awaiting it blocks past every gateway timeout. | Ingestion is fire-and-forget and every stage idempotent. The client polls a deliberately uncached status endpoint. |
| **8** | **Repeated reads of near-static data are wasted latency.** Catalog and profiles change on publish, not per request. | Cache-aside Redis with per-endpoint TTLs and targeted invalidation. Redis is **optional** — any failure falls through to MongoDB. |
| **9** | **Chat that forgets everything isn't a discussion.** An in-memory relay loses the transcript on reload. | Messages persist to MongoDB *before* broadcast; history pages in over REST with an ObjectId cursor, merged by shared `_id`. |
| **10** | **Client-trusted identity and pricing are not security.** A client naming its own sender or price has neither. | JWT socket handshakes, enrollment-checked room joins, server-stamped sender identity, and Razorpay orders priced from the database and re-verified. |
| **11** | **Rich interfaces should not tax the API.** Proxying large video through Node means buffering, held-open requests, and OOM. | The client requests a short-lived HMAC signature and uploads straight to Cloudinary. Video never touches the API process. |

---

## System Topology

A React 19 SPA on Vercel reaches an Express 5 (ESM) API on Render over REST and Socket.io, both JWT-authenticated. The API layers `routes → controllers → services` behind `isAuth` middleware and hosts the Socket.io room server.

Two paths bypass the API entirely: video uploads go browser → Cloudinary with a server-signed request, and live classes run peer-to-peer through ZegoCloud.

Behind the API sit **MongoDB Atlas** (documents plus 3072-dim vectors in one store via Vector Search), **Redis** (cache-aside, optional), and **Google Gemini** in three roles — File API transcription, `embedContent` vectors, and `generateContent` for reranking and generation. **Razorpay** handles payments, **Brevo** sends OTP mail over HTTP, and **Firebase** provides the Google OAuth popup only.

---

## Subsystem Deep Dives

### AI & Data

**Hybrid RAG Retrieval** — Vector search blurs exact terms; keyword search misses paraphrase. Both arms run under `Promise.all`: Atlas `$vectorSearch` (cosine, `numCandidates` = 10 × limit, `lectureId`/`courseId` pushed down as index `filter`s) and a deterministic `$in` keyword match scored by distinct term hits. RRF assigns `1/(k + rank)` per list and sums, so two incomparable scoring systems merge with **no cross-modal normalization**. Output: top 12, recall from semantics and precision on literals in one concurrent round.

**LLM Reranking** — Twelve candidates still carry near-misses. A dedicated Gemini pass reorders 12 → 4 before generation at `temperature: 0` under a `responseSchema`. Returned indices are validated against the candidate list, so a hallucinated index is discarded rather than dereferenced; failure degrades to retrieval order. Total cost stays at **exactly two Gemini calls per question**.

**Verifiable Source Attribution** — A model asked for citations will fabricate them, so the model never emits a timestamp. Generation returns `{ answer, usedIndices }` under a JSON schema; the server maps indices back to chunk documents and reads timestamps from the documents. Malformed or out-of-range indices are dropped, making it **structurally impossible to cite a chunk that wasn't retrieved**.

**Deterministic Ingestion** — LLM-driven chunking costs a call per lecture, is non-reproducible, and adds a failure mode for a task needing no inference. Chunking, sentence splitting, and keyword extraction are **pure functions**: real `cl100k_base` tiktoken counts (not `length / 4`), a splitter that keeps `Node.js`, `3.14`, `Ph.D.`, and `array.map()` intact, and chunks targeting 500 tokens with a 650 ceiling, 250 minimum, sentence-boundary breaks, and ~50 tokens of whole-sentence overlap. Tunables are isolated in [chunkingConfig.js](../Backend/services/ai/ingestion/chunkingConfig.js). Free, instant, and **byte-identical on re-run** — which is what makes every stage safely retryable.

**Provable Index Readiness** — "Embeddings written" ≠ "search works". An `INDEXING` stage polls Atlas with one of the lecture's own embeddings, scoped to its own `lectureId`, until the index serves it (`ATLAS_INDEX_TIMEOUT_MS`, default 90 s). On timeout the lecture is still marked `READY` — keyword retrieval works regardless — and the UI reads real state from `status`/`chunkCount`. Eliminates the **"READY but returns nothing"** bug class entirely.

**Cache-Aside Redis with Graceful Degradation** — `getOrSetCache(key, fetchCallback, ttl)` in [redis.js](../Backend/config/redis.js), with explicit `clearCache(...keys)` on every affected write. Two properties make it production-safe: absent `REDIS_URL` or `status !== "ready"` calls the fetch callback directly, and any Redis exception is caught and answered from MongoDB. TTLs are tiered by volatility — 1 h catalog, 24 h course/lecture/creator, 5 min OTP where the TTL *is* the expiry mechanism. **A cache outage degrades latency rather than causing an incident.**

### Platform

**Persisted Real-Time Discussion** — JWT-authenticated handshake (`socket.auth.token`, Bearer, or cookie); room joins checked against enrollment through [courseAccess.js](../Backend/utils/courseAccess.js) — **the same helper the REST route uses, so the socket and HTTP doors enforce one rule**. Messages persist first: a write failure broadcasts nothing and returns `chat_error`. The broadcast `id` *is* the MongoDB `_id`, so `useCourseChat` merges live and historical messages without duplicates. Presence is deduplicated per user, so two tabs count once.

**Server-Verified Payments** — Any client-supplied amount or success flag is trivially forged. `RazorpayOrder` reads the price from the `Course` document, so a tampered client amount has no effect. `verifyPayment` re-fetches the order from Razorpay and requires `status === "paid"` before writing enrollment and invalidating cache keys. HMAC signature verification and `isAuth` on these routes remain outstanding — see [project_improvements.md](../project_improvements.md).

**Signed Direct-to-CDN Streaming** — `GET /api/upload/signature` returns a short-lived HMAC signature, timestamp, API key, cloud name, and folder; the secret never leaves the server. Server-side ingestion later **streams** video to a temp file rather than buffering, cleaning up in `finally`. Zero API memory pressure on the heaviest workload, and a genuine client-side progress bar.

**Dual-Path Authentication** — The SPA and API are cross-origin and third-party cookie handling is increasingly restrictive, but `localStorage` tokens are XSS-readable — so the app issues both and accepts either. bcrypt (cost 10) for passwords, Google OAuth via Firebase popup exchanged for the app's own JWT, `isAuth` resolving header-first then cookie, `.select("-password")` on every profile read. Reset uses a 4-digit OTP with a 5-minute Redis TTL and checked-timestamp Mongo fallback over Brevo's HTTP API, because PaaS hosts commonly block outbound SMTP.

**Live Classes over Polling, Not Sockets** — A live badge is one boolean that changes maybe twice per class; holding a WebSocket open per viewer is the wrong trade. `LiveClass.jsx` mounts the prebuilt ZegoUIKit with `courseId` as room ID, assigning `Host` to educators and `Audience` to everyone else; host join/leave syncs `isLive`, and course pages poll every 30 s. Stateless, free reconnect handling. **Sockets are spent where they earn their keep — chat.**

### Interface

**GPU-Accelerated Interface** — WebGL is a large bundle cost and a landing page is not worth a framework, so the library matches the scene's complexity: Three.js / React Three Fiber for genuine 3D, **OGL** (roughly 10× smaller) for the single-shader `Iridescence` background, GSAP and Framer Motion for timeline and layout transitions.

**Redux Toolkit State Boundaries** — Course, lecture, user, and review data are read by deeply nested components across unrelated routes, where prop-drilling and Context both break down. Four focused slices hydrate once at boot, with `localStorage` rehydration on the user slice so there is no logged-out flash on refresh. Fetching hooks run on mount in `App.jsx`, so navigation reads Redux instead of awaiting a fetch. Session checks clear state **only on 401** — a transient network error preserves the session.

---

## Technical Highlights

| Highlight | Why it matters |
| :--- | :--- |
| **Hybrid retrieval (vector + lexical)** | Solves the failure mode each arm has alone: embeddings blur exact identifiers, keywords miss paraphrase. Both run concurrently. |
| **Reciprocal Rank Fusion (`k = 60`)** | Merges two ranked lists by rank, so cosine similarity and term-match counts combine **without inventing a normalization scheme** between incomparable scales. |
| **Pushed-down Atlas filters** | `lectureId`/`courseId` are declared `filter` fields *in the index*, so scoping happens inside ANN traversal — not as a post-filter that silently shrinks results. |
| **Schema-constrained reranking** | A `responseSchema` at `temperature: 0` makes output parseable by construction; indices are still validated, so hallucinations are discarded rather than dereferenced. |
| **Index-readiness probe before `READY`** | Queries the live index with the lecture's own embedding, eliminating a bug class with no error signal. |
| **Fully idempotent pipeline** | Transcripts are never regenerated and embedded lectures are skipped, so a failure at embedding never forces re-transcription — the precondition for distributing ingestion to workers. |
| **Single-source tokenizer** | Ingestion and query preprocessing share one tokenizer, so stored keywords and query terms are **guaranteed `$in`-comparable**. A backfill script keeps old chunks identical to fresh ones. |
| **Memory-safe retrieval** | Search runs inside Atlas and the projection excludes `embedding`, so **no downstream stage can leak a 3072-float array**. |
| **Frozen embedding constants** | Model and dimensionality are code constants, not env vars — swapping them silently invalidates every stored vector with **no runtime error**. |
| **Exactly two LLM calls per answer** | Rerank + generate. Retrieval, fusion, chunking, and keyword extraction are all deterministic. |
| **Graceful degradation everywhere** | Redis → MongoDB, reranker → retrieval order, generation → "not enough information". **No dependency failure returns a 500.** |
| **Batched writes** | Embeddings in batches of 100 with a single `bulkWrite`; chunks via `insertMany`. 60 writes collapse into one. |
| **Server-stamped socket identity** | Sender name, role, and timestamp are written server-side, so a forged payload is overwritten — covered by an explicit test. |
| **One authorization rule, two transports** | `courseAccess.js` backs both the socket `join_room` check and the REST history route, so they cannot drift apart. |
| **Cursor pagination without `skip`** | The `{course, _id}` compound index covers the query exactly; ObjectId monotonicity makes `_id < before` a valid cursor. One extra row derives `hasMore` — no count query. |
| **Integration tests over mocks** | 18 tests drive a real `mongod`, the real chat route, and real `socket.io-client` connections. **A pass means the persistence path actually works.** |

---

<div align="center">

**[Back to README](../README.md)** · **[Next: AI Pipeline](AI_PIPELINE.md)**

</div>
