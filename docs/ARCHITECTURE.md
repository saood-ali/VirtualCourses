# Architecture

> Part of the [VirtualCourses](../README.md) documentation. See also:
> [AI Pipeline](AI_PIPELINE.md) · [Performance](PERFORMANCE.md) · [API Reference](API.md) · [Security](SECURITY.md) · [Limitations & Roadmap](ROADMAP.md)

This document covers the design decisions behind the system, the runtime topology, each subsystem's engineering rationale, and the annotated project structure.

---

## 📑 Contents

[Why This Project Exists](#-why-this-project-exists) · [System Topology](#-system-topology) · [Subsystem Deep Dives](#-subsystem-deep-dives) · [Technical Highlights](#-technical-highlights) · [Project Structure](#-project-structure)

---

## 🎯 Why This Project Exists

Each problem below is a real constraint that shaped a specific design decision in this codebase.

### 1. Video lectures are unstructured data

A 40-minute lecture is the richest asset on a learning platform and the least accessible. It cannot be searched, quoted, or reasoned over. A student stuck on one concept has two options: scrub the timeline, or leave the platform.

**Solution.** An ingestion pipeline converts every uploaded video into structured, retrievable knowledge — transcription via the Gemini File API, deterministic sentence-aware chunking, 3072-dimensional embeddings, and an Atlas Vector Search index. Video in, queryable knowledge base out, with no manual step.

### 2. Traditional search cannot understand learning intent

`LIKE '%build APIs%'` matches nothing useful. A student's phrasing and a course's taxonomy rarely share vocabulary.

**Solution.** Course search runs a cheap deterministic regex pass first; only when that returns nothing does a Gemini call map the free-text query onto the platform's fixed category taxonomy. The common case costs zero tokens; the hard case still resolves to something the catalog can actually match.

### 3. Pure vector search is confidently wrong on exact terms

Embeddings capture meaning but blur specifics. Ask about `useEffect` and cosine similarity happily returns a chunk about lifecycle methods in general — semantically close, literally useless.

**Solution.** **Hybrid retrieval.** Vector search and deterministic keyword search run concurrently and are fused by **Reciprocal Rank Fusion**, which merges by *rank* rather than score — so two incomparable scoring systems combine without any normalization hack.

### 4. Retrieval alone is not precision

Twelve fused candidates still contain near-misses, and stuffing all twelve into a generation prompt dilutes the answer.

**Solution.** A dedicated **Gemini reranking pass** reads the question against the 12 candidates and returns the 4 that actually answer it — JSON-schema-constrained, temperature 0, indices validated against the candidate list. If it fails, retrieval order is used as-is.

### 5. An LLM will happily cite a timestamp it invented

If the model is asked to produce source citations, it will produce plausible ones whether or not they exist.

**Solution.** The model returns only *indices* into the retrieved candidate set. Timestamps and identifiers are attached server-side from the chunk documents themselves. Out-of-range indices are dropped, so **a citation can only ever point at a chunk that was genuinely retrieved.**

### 6. "Ready" that isn't actually ready is a silent failure

Atlas vector indexes build asynchronously. Marking a lecture `READY` when the last embedding is written produces the worst failure mode available: a UI that says ready and a search that returns nothing, with no error anywhere.

**Solution.** An `INDEXING` stage probes the live index with one of the lecture's *own* embeddings, scoped to its own `lectureId`. `READY` is only set once the index actually serves that vector back. **The status provably means searchable.**

### 7. Transcription takes minutes; HTTP requests do not

Awaiting a multi-minute transcription blocks the response past every gateway timeout.

**Solution.** Ingestion is fire-and-forget, triggered without `await`. Every stage is idempotent, so a lost or partial run is safe to re-run. The client polls an intentionally **uncached** status endpoint that drives a live stage checklist.

### 8. Repeated reads of near-static data are wasted latency

The catalog, curricula, and creator profiles change on publish — not per request — yet were re-queried on every page view.

**Solution.** Cache-aside Redis with per-endpoint TTLs and targeted invalidation on write. Critically, **Redis is optional**: no URL, a failed connection, or a thrown error all fall through to MongoDB. A cache outage costs latency, never correctness.

### 9. Real-time chat that forgets everything isn't a discussion

An in-memory socket relay loses the conversation on reload, and anyone arriving late sees an empty room.

**Solution.** Messages are persisted to MongoDB **before** broadcast. History pages in over REST with an ObjectId cursor, and live messages carry the same MongoDB `_id` as their historical copy — so the client merges both streams by id with no duplicates.

### 10. Client-trusted identity and pricing are not security

A client that can name its own sender, or its own price, has neither.

**Solution.** Socket handshakes are JWT-authenticated, room joins are checked against enrollment, and sender name/role/timestamp are **stamped server-side** — a spoofed payload is overwritten, which is an explicitly tested path. Razorpay orders are created from the database price and re-verified against Razorpay's API before enrollment is written.

### 11. Rich interfaces should not tax the API

Multi-hundred-megabyte video proxied through Node means buffering, held-open requests, and OOM on a small instance.

**Solution.** The client requests a short-lived HMAC signature and uploads **straight to Cloudinary** with a real progress bar. The API secret never leaves the server; the video never touches the API process.

---

## 🏗 System Topology

```
┌───────────────────────────────────────────────────────────────────────┐
│  CLIENT — React 19 SPA (Vercel)                                       │
│  Redux Toolkit · React Router 7 · Tailwind v4 · axiosClient           │
└──┬──────────────────┬──────────────────┬───────────────┬──────────────┘
   │ REST (JWT)       │ Socket.io (JWT)  │ direct upload │ WebRTC
   ▼                  ▼                  ▼               ▼
┌────────────────────────────────┐  ┌────────────┐  ┌────────────┐
│  API — Express 5 (ESM)         │  │ Cloudinary │  │ ZegoCloud  │
│  routes → controllers →        │  │ CDN+store  │  │ live rooms │
│  services · isAuth middleware  │  └────────────┘  └────────────┘
│  Socket.io server (rooms)      │
└──┬──────────┬──────────┬───────┘
   │          │          │
   ▼          ▼          ▼
┌────────┐ ┌───────┐ ┌────────────────────────────────────────┐
│ Mongo  │ │ Redis │ │  Google Gemini                         │
│ Atlas  │ │ cache │ │  • File API      → transcription       │
│ + Vec  │ │ (opt) │ │  • embedContent  → 3072-dim vectors    │
│ Search │ │       │ │  • generateContent → rerank + answer   │
└────────┘ └───────┘ └────────────────────────────────────────┘
              ┌────────────┐  ┌────────────┐  ┌────────────┐
              │  Razorpay  │  │   Brevo    │  │  Firebase  │
              │  payments  │  │  OTP mail  │  │   OAuth    │
              └────────────┘  └────────────┘  └────────────┘
```

---

## 🔬 Subsystem Deep Dives

### 🧠 Hybrid RAG Retrieval

| | |
| :--- | :--- |
| **Problem** | Vector search blurs exact terms; keyword search misses paraphrase. Either one alone produces a candidate set with obvious holes. |
| **Engineering solution** | Run both arms concurrently and fuse them by **rank**, not score, using Reciprocal Rank Fusion (`k = 60`). |
| **Technical design** | `Promise.all` over Atlas `$vectorSearch` (cosine, `numCandidates` = 10 × limit, `lectureId`/`courseId` pushed down as index `filter`s) and a deterministic `$in` keyword match scored by distinct term hits. RRF assigns `1/(k + rank)` per list and sums — so two incomparable scoring systems merge with **no cross-modal normalization**. Output: top 12. |
| **Impact** | Recall from semantic similarity, precision on literal identifiers, and a candidate set that is meaningfully rerankable — from one round of concurrent queries. |

### 🎯 LLM Reranking

| | |
| :--- | :--- |
| **Problem** | Twelve candidates still carry near-misses, and a diluted prompt yields a diluted answer. |
| **Engineering solution** | A dedicated Gemini pass that reorders 12 → 4 *before* generation. |
| **Technical design** | `temperature: 0` with a `responseSchema`-constrained JSON output. Returned indices are validated against the candidate list, so a hallucinated index is discarded rather than dereferenced. Failure degrades to retrieval order — the request never fails. |
| **Impact** | Generation sees four highly relevant chunks instead of twelve mixed ones. Total cost stays at **exactly two Gemini calls per question.** |

### 🔒 Verifiable Source Attribution

| | |
| :--- | :--- |
| **Problem** | A model asked for citations will fabricate them. |
| **Engineering solution** | The model never emits a timestamp — only indices into the set it was given. |
| **Technical design** | Generation returns `{ answer, usedIndices }` under a JSON schema. The server maps indices back to chunk documents and reads timestamps from the documents. Malformed or out-of-range indices are dropped. |
| **Impact** | **Structurally impossible to cite a chunk that wasn't retrieved.** No embeddings, scores, or internal structures ever reach the client. |

### ⚙️ Deterministic Ingestion

| | |
| :--- | :--- |
| **Problem** | LLM-driven chunking costs a call per lecture, is non-reproducible, and adds a failure mode — for a task that doesn't need inference. |
| **Engineering solution** | Chunking, sentence splitting, and keyword extraction are **pure functions**. Zero LLM involvement. |
| **Technical design** | Real `cl100k_base` tiktoken counts (not `length / 4`); a custom splitter that keeps `Node.js`, `3.14`, `Ph.D.`, and `array.map()` intact; chunks target 500 tokens with a hard 650 ceiling and 250 minimum, break only on sentence boundaries, and carry ~50 tokens of whole-sentence overlap forward. Tunables are isolated in [chunkingConfig.js](../Backend/services/ai/ingestion/chunkingConfig.js). |
| **Impact** | Free, instant, and **byte-identical on re-run** — which is what makes every stage safely retryable. |

### ✅ Provable Index Readiness

| | |
| :--- | :--- |
| **Problem** | Atlas vector indexes build asynchronously. "Embeddings written" ≠ "search works". |
| **Engineering solution** | An `INDEXING` stage that queries the live index before declaring readiness. |
| **Technical design** | Polls Atlas with one of the lecture's own embeddings, scoped to its own `lectureId`, until the index serves it (`ATLAS_INDEX_TIMEOUT_MS`, default 90 s). On timeout the lecture is still marked `READY` — keyword retrieval works regardless — and the UI reads the real state from `status`/`chunkCount`. |
| **Impact** | Eliminates the **"READY but returns nothing"** class of bug entirely. |

### ⚡ Cache-Aside Redis with Graceful Degradation

| | |
| :--- | :--- |
| **Problem** | Hot reads (catalog, curriculum `populate` joins, creator profiles) hit MongoDB on every request for data that changes on publish. |
| **Engineering solution** | `getOrSetCache(key, fetchCallback, ttl)` in [redis.js](../Backend/config/redis.js), with explicit `clearCache(...keys)` on every affected write. |
| **Technical design** | Two properties make it production-safe: **(1)** absent `REDIS_URL` or `status !== "ready"` calls the fetch callback directly; **(2)** any Redis exception is caught, logged, and answered from MongoDB. TTLs are tiered by volatility — 1 h catalog, 24 h course/lecture/creator, 5 min OTP where the TTL *is* the expiry mechanism. |
| **Impact** | Sub-millisecond hot reads, and **a cache outage degrades latency rather than causing an incident.** The app runs correctly with no Redis at all. |

### 💬 Persisted Real-Time Discussion

| | |
| :--- | :--- |
| **Problem** | An in-memory relay drops the transcript on reload and shows late joiners an empty room. |
| **Engineering solution** | Write-before-broadcast persistence, with cursor-paginated history over REST. |
| **Technical design** | JWT-authenticated handshake (`socket.auth.token`, Bearer, or cookie); room joins checked against enrollment through [courseAccess.js](../Backend/utils/courseAccess.js) — **the same helper the REST route uses, so the socket and HTTP doors enforce one rule.** Messages persist first: a write failure broadcasts nothing and returns `chat_error`. The broadcast `id` *is* the MongoDB `_id`, so `useCourseChat` merges live and historical messages by id without duplicates. Presence is deduplicated per user, so two tabs count once. |
| **Impact** | A discussion that survives reloads, pages backwards without `skip`, and cannot be posted to under a forged identity. |

### 💳 Server-Verified Payments

| | |
| :--- | :--- |
| **Problem** | Any client-supplied amount or success flag is trivially forged. |
| **Engineering solution** | Orders are created from the database price; success is confirmed against Razorpay's API, not the browser's word. |
| **Technical design** | `RazorpayOrder` reads the price from the `Course` document — a tampered client amount has no effect. `verifyPayment` re-fetches the order from Razorpay and requires `status === "paid"` before writing to `User.enrolledCourses` and `Course.enrolledStudents` and invalidating the affected cache keys. |
| **Impact** | Enrollment cannot be granted by a manipulated client response. See [Known gaps](SECURITY.md#known-gaps) — HMAC signature verification and `isAuth` on these routes are outstanding. |

### 🎬 Signed Direct-to-CDN Streaming

| | |
| :--- | :--- |
| **Problem** | Proxying large video through Node means buffering it, holding a request open for minutes, and risking OOM on a small instance. |
| **Engineering solution** | Short-lived HMAC upload signatures — the browser talks to Cloudinary directly. |
| **Technical design** | `GET /api/upload/signature` returns a signature, timestamp, API key, cloud name, and folder. The secret never leaves the server. Server-side ingestion later **streams** the video to a temp file rather than buffering it, cleaning up in `finally`. |
| **Impact** | Zero API memory pressure on the heaviest workload, no request-timeout risk, and a genuine client-side progress bar. |

### 🔐 Dual-Path Authentication

| | |
| :--- | :--- |
| **Problem** | The SPA and API are cross-origin, and third-party cookie handling is increasingly restrictive — but `localStorage` tokens are XSS-readable. |
| **Engineering solution** | Issue both, accept either. |
| **Technical design** | bcrypt (cost 10) for passwords, Google OAuth via Firebase popup exchanged for the app's own JWT. `isAuth` resolves the token header-first, then cookie. `.select("-password")` on every profile read. Reset uses a 4-digit OTP with a 5-minute Redis TTL and a checked-timestamp Mongo fallback, delivered over Brevo's HTTP API — because PaaS hosts commonly block outbound SMTP. |
| **Impact** | The session works regardless of cookie policy, and password recovery keeps working through a cache outage. The tradeoff is documented as [gap #6](SECURITY.md#known-gaps). |

### 📡 Live Classes over Polling, Not Sockets

| | |
| :--- | :--- |
| **Problem** | A live badge is one boolean that changes maybe twice per class. Holding a WebSocket open per viewer to deliver it is the wrong trade. |
| **Engineering solution** | ZegoUIKit for the room itself; a 30-second poll for the badge. |
| **Technical design** | `LiveClass.jsx` mounts the prebuilt UIKit with `courseId` as the room ID, assigning `Host` to educators and `Audience` to everyone else. Host join/leave syncs `isLive` to `POST /api/live/start`; course pages poll `GET /api/live/details/:courseId`. |
| **Impact** | Stateless, free reconnect handling, one tiny request per viewer per 30 s. **Sockets are spent where they earn their keep — chat.** |

### 🧊 GPU-Accelerated Interface

| | |
| :--- | :--- |
| **Problem** | WebGL is a large bundle cost, and a landing page is not worth a framework. |
| **Engineering solution** | Match the library to the scene's actual complexity instead of defaulting to the biggest one. |
| **Technical design** | Three.js / React Three Fiber for genuine 3D scenes; **OGL** (roughly 10× smaller) for the single-shader `Iridescence` background; GSAP and Framer Motion for timeline and layout transitions. |
| **Impact** | Hardware-accelerated visuals without paying Three.js's bundle cost for a one-shader gradient. |

### 🗂 Redux Toolkit State Boundaries

| | |
| :--- | :--- |
| **Problem** | Course, lecture, user, and review data are read by deeply nested components across unrelated routes — prop-drilling and Context both break down. |
| **Engineering solution** | Four focused slices, hydrated once at boot. |
| **Technical design** | `user` / `course` / `lecture` / `review` slices with `localStorage` rehydration on the user slice, so there is no logged-out flash on refresh. Data-fetching hooks run on mount in `App.jsx`, so route navigation reads Redux instead of awaiting a fetch. Session checks clear state **only on 401** — a transient network error preserves the session. |
| **Impact** | Predictable state across auth, cart, player, and dashboard flows, with no redundant refetching between routes. |

---

## 🚀 Technical Highlights

Resume-relevant engineering decisions, and why each one is non-trivial.

| Highlight | Why it matters |
| :--- | :--- |
| **Hybrid retrieval (vector + lexical)** | Solves the failure mode each arm has alone: embeddings blur exact identifiers, keywords miss paraphrase. Both run concurrently. |
| **Reciprocal Rank Fusion (`k = 60`)** | Merges two ranked lists by rank, so cosine similarity and term-match counts combine **without inventing a normalization scheme** between incomparable scales. |
| **Atlas `$vectorSearch` with pushed-down filters** | `lectureId`/`courseId` are declared `filter` fields *in the index*, so scoping happens inside ANN traversal — not as a post-filter that silently shrinks the result set. |
| **Gemini reranking with schema-constrained output** | A `responseSchema` at `temperature: 0` makes the output parseable by construction; indices are still validated against the candidate list, so hallucinations are discarded rather than dereferenced. |
| **Index-readiness probe before `READY`** | Queries the live index with the lecture's own embedding. Eliminates "READY but returns nothing" — a bug class with no error signal. |
| **Fully idempotent pipeline** | Existing transcripts are never regenerated; fully embedded lectures are skipped. A failure at embedding does not force re-transcription, and **re-running is always safe** — the precondition for distributing ingestion to workers. |
| **Single-source tokenizer** | Ingestion and query preprocessing share one tokenizer, so stored keywords and query terms are **guaranteed `$in`-comparable**. A backfill script keeps pre-existing chunks identical to fresh ones. |
| **Memory-safe retrieval** | Vectors never leave MongoDB: search runs inside Atlas and the projection excludes `embedding`, so **no downstream stage can leak a 3072-float array**. |
| **Frozen embedding constants** | Model and dimensionality are code constants, not env vars — because swapping them silently invalidates every stored vector and breaks a fixed-`numDimensions` index with **no runtime error**. |
| **Exactly two LLM calls per answer** | Rerank + generate. Retrieval, fusion, chunking, and keyword extraction are all deterministic. |
| **Fire-and-forget ingestion** | A multi-minute job never blocks the HTTP response; progress is exposed through a deliberately uncached status endpoint. |
| **Graceful degradation at every AI boundary** | Redis → MongoDB, reranker → retrieval order, generation → "not enough information". **No dependency failure returns a 500.** |
| **Batched writes** | Embeddings in batches of 100 with a single `bulkWrite`; chunks via `insertMany`. 60 writes collapse into one. |
| **Server-stamped socket identity** | Sender name, role, and timestamp are written server-side, so a forged payload is overwritten — covered by an explicit test. |
| **One authorization rule, two transports** | `courseAccess.js` backs both the socket `join_room` check and the REST history route, so they cannot drift apart. |
| **Cursor pagination without `skip`** | The `{course, _id}` compound index covers the query exactly; ObjectId monotonicity makes `_id < before` a valid "older than" cursor. One extra row derives `hasMore` — no second count query. |
| **Server-side payment verification** | Orders priced from the database, then re-fetched from Razorpay and required to be `paid` before enrollment is written. |
| **Signed direct-to-CDN uploads** | Large media bypasses the API entirely while the API secret stays server-side. |
| **Streaming file handling** | Video is piped to disk rather than buffered in memory, with `finally`-block cleanup. |
| **Integration tests over mocks** | 18 tests drive a real `mongod`, the real chat route, and real `socket.io-client` connections. **A pass means the persistence path actually works.** |

---

## 📁 Project Structure

```
VirtualCourses/
│
├── Backend/                              # Express 5 API (ESM)
│   ├── index.js                          # Express app, Socket.io server, route mounting
│   │
│   ├── services/ai/                      # ⭐ The architectural centerpiece
│   │   ├── ingestion/                    #   video → retrievable knowledge
│   │   │   ├── lecturePipeline.js        #     Orchestrator: sequences stages, owns READY
│   │   │   ├── transcriptionService.js   #     Gemini File API upload + poll + transcribe
│   │   │   ├── sentenceSplitter.js       #     Abbreviation-safe splitter + topic boundaries
│   │   │   ├── semanticChunker.js        #     Token-budget chunking with overlap
│   │   │   ├── chunkingConfig.js         #     Tunables, isolated from the algorithm
│   │   │   ├── chunkPipeline.js          #     transcript → normalized → LectureChunk docs
│   │   │   ├── embeddingService.js       #     Batched embeddings, bulkWrite, idempotent
│   │   │   ├── keywordExtractor.js       #     Shared tokenizer + term-frequency keywords
│   │   │   └── tokenEstimator.js         #     tiktoken cl100k_base (cached encoder)
│   │   ├── retrieval/
│   │   │   ├── retrievalPipeline.js      #     Hybrid: vector ∥ keyword → RRF
│   │   │   ├── vectorSearch.js           #     Atlas $vectorSearch (filters inside the query)
│   │   │   ├── keywordSearch.js          #     $in keyword matching + scoring
│   │   │   └── reciprocalRankFusion.js   #     RRF, k = 60
│   │   ├── generation/
│   │   │   ├── reranker.js               #     Gemini rerank (top 12 → top 4)
│   │   │   └── answerGenerator.js        #     Structured answer + source indices
│   │   └── providers/
│   │       └── geminiProvider.js         #     Shared client + frozen model constants
│   │
│   ├── controllers/                      # auth, user, course, search, order, live, review, chat
│   ├── models/                           # User, Course, Lecture, LectureChunk,
│   │                                     #   Review, LiveSession, ChatMessage
│   ├── routes/                           # Thin URL → controller mapping; applies isAuth
│   ├── middleware/                       # isAuth (JWT: header → cookie), multer (Cloudinary)
│   ├── config/                           # redis (getOrSetCache/clearCache), connectDB,
│   │                                     #   token, cloudinary, sendMail, socketHandler
│   ├── utils/                            # courseAccess.js — ONE enrollment check,
│   │                                     #   shared by the socket and REST doors
│   ├── tests/                            # Integration suite: real mongod, real sockets
│   │   └── helpers/                      #   harness.js, server.js
│   └── scripts/                          # backfillChunkKeywords.js,
│                                         #   removeVerificationFixture.js
│
├── Frontend/                             # React 19 SPA
│   ├── vite.config.js                    # React + Tailwind v4 plugins
│   ├── vercel.json                       # SPA rewrite — all paths → index.html
│   └── src/
│       ├── App.jsx                       # Route table, auth/role guards, boot-time prefetch
│       ├── pages/                        # Home, ViewCourse, SearchWithAi, LiveClass,
│       │   └── Educator/                 #   Dashboard, Courses, Create/Edit Lecture & Course
│       ├── components/                   # Navbar, AIExplainer, CourseChat,
│       │                                 #   animated/visual components
│       ├── redux/                        # user/course/lecture/review slices
│       │                                 #   (localStorage rehydrate)
│       ├── customHooks/                  # Session, course, review fetching, useCourseChat
│       │                                 #   (merges REST history with live sockets by id)
│       ├── utils/firebase.jsx            # Firebase app init + Google provider
│       └── config/
│           ├── axiosClient.js            # Axios instance with auth interceptor
│           └── socketClient.js           # Shared Socket.io client (token re-read per reconnect)
│
├── docs/
│   ├── ARCHITECTURE.md                   # This document
│   ├── AI_PIPELINE.md                    # Ingestion, retrieval, generation internals
│   ├── PERFORMANCE.md                    # Caching, batching, concurrency, polling
│   ├── API.md                            # REST endpoints + Socket.io events
│   ├── SECURITY.md                       # Implemented controls + known gaps
│   ├── ROADMAP.md                        # Known limitations + planned work
│   └── atlas-vector-index.json           # Vector Search index definition (3072d, cosine)
├── design.md                             # Architecture & UI specification
├── theme.md                              # Design system: palette, type scale, constraints
└── project_improvements.md               # Self-audit / improvement backlog
```

<details>
<summary><b>Why the AI layer is structured this way</b></summary>

<br />

Every ingestion stage is a **single-responsibility module with an identical contract**: take a `lectureId`, do one job, update `processingStatus`, clean up after itself on failure. Three concrete payoffs:

1. **Independent testing.** `chunkSentences()` and `splitIntoSentences()` are pure functions over strings — testable with zero I/O, no database, and no API key.
2. **Independent retry.** Because every stage is idempotent, a failure at embedding never forces re-transcription. Re-running is always safe.
3. **A clean orchestration seam.** `lecturePipeline.js` only chains existing calls; no stage was rewritten to accommodate it.

Configuration is deliberately separated from algorithm ([chunkingConfig.js](../Backend/services/ai/ingestion/chunkingConfig.js)), and the embedding model plus its dimensionality are **frozen constants in one file** — because changing either silently invalidates every stored vector and the Atlas index.

</details>

---

[← Back to the README](../README.md)
