# VirtualCourses

An AI-powered video course marketplace. Educators upload lecture videos; an automated ingestion pipeline transcribes, chunks, and indexes them so students can ask a question about any lecture and get a context-grounded answer with timestamped sources. Built with a React 19 + Vite frontend, an Express 5 API, MongoDB (Atlas Vector Search), Redis caching, and the Google Gemini API.

## Architecture Overview

- **Monorepo with two apps**: an Express + Mongoose REST API ([Backend/](Backend/)) and a React SPA ([Frontend/](Frontend/)).
- **AI ingestion pipeline** runs server-side, fire-and-forget: transcription → chunking → embedding → Atlas vector-index readiness probe.
- **Hybrid RAG retrieval** (vector + keyword, fused with Reciprocal Rank Fusion) → Gemini reranker → Gemini answer generator with structured JSON output.
- **Redis** is a transparent caching layer (course/lecture/user endpoints) with automatic DB fallback when it is unavailable; cache keys are invalidated on writes.
- **Auth** is JWT-based (Bearer header or `httpOnly` cookie); educator-owned mutations are protected by `isAuth` middleware.
- **Real-time**: ZegoUIKit-powered live classes whose live state is persisted per course in MongoDB, plus a Socket.io per-course chat with JWT-authenticated handshakes and enrollment-scoped rooms.

## Technical Highlights

- **Hybrid retrieval pipeline** — vector search (cosine, executed entirely inside Atlas) and deterministic keyword search run concurrently and are fused by Reciprocal Rank Fusion, giving an LLM-rerankable candidate set without cross-modal score normalization.
- **LLM reranking, not just retrieval** — a separate Gemini pass reorders the top 12 fused candidates down to 4 before generation, using JSON-schema-constrained output that is validated client-side; failures degrade to retrieval order.
- **Deterministic ingestion** — chunking, sentence splitting, and keyword extraction are pure functions (no LLM) and idempotent; embeddings use `gemini-embedding-001` (3072 dims) with batched writes.
- **A `READY` status that provably means searchable** — after embeddings are written, the pipeline probes the Atlas index with one of the lecture's own embeddings and only then marks the lecture `READY`. The status endpoint is uncached so a UI checklist can poll it every 3s.
- **Single-source tokenizer** — ingestion and query preprocessing share one tokenizer, so stored keywords and query terms are guaranteed `$in`-comparable; a backfill script keeps pre-existing chunks identical to fresh ones.
- **Memory-safe retrieval** — vectors never leave MongoDB: search uses Atlas `$vectorSearch` with `filter` fields, and the retrieval projection excludes the embedding field so no downstream stage can leak it.
- **Graceful degradation** — Redis, reranker, and answer generation all have explicit fallbacks (DB, retrieval order, "not enough information" message) instead of failing requests.

## RAG Pipeline

Lecture videos are ingested in the background and become queryable; student questions run a hybrid retrieval → rerank → generate flow. Exactly two Gemini calls per question.

**Ingestion (background, fire-and-forget, idempotent):**

1. On video attach, the lecture is marked `UPLOADED` and the pipeline is triggered without blocking the API response.
2. **Transcription** — the video is streamed to a temp file, uploaded to Gemini's File API, polled until processed, and transcribed with a verbatim-transcription prompt; existing transcripts are never regenerated.
3. **Cleaning & segmentation** — the transcript is deterministically normalized, then split into sentences with a custom splitter that preserves abbreviations, decimals, and dotted code syntax (`Node.js`, `array.map`), tagging paragraph breaks and heading-like lines as topic boundaries.
4. **Semantic chunking** — deterministic, no LLM: chunks target ~500 tokens (hard ceiling 650, min 250), never split mid-sentence, and carry ~50 tokens of whole-sentence overlap into the next chunk. Tiny tails are merged into the previous chunk.
5. **Keyword extraction** — pure term-frequency ranking over a shared tokenizer (stopword list tuned for lecture filler like "okay", "basically"); top 15 keywords per chunk are stored for the keyword retrieval arm.
6. **Embedding** — each chunk is embedded with `gemini-embedding-001` (3072 dims) in batches of 100, written with a single `bulkWrite`. Idempotent: fully embedded lectures are skipped.
7. **Index readiness** — `INDEXING` polls Atlas with one of the lecture's own embeddings (scoped to its own `lectureId`) until the vector index serves it, then sets `READY`. If the index never responds, the lecture is still marked `READY` — keyword search works — but the UI knows it via `chunkCount`/status.

**Retrieval & generation (per student question):**

1. **Normalize** — the question is whitespace-normalized; keyword terms are extracted through the shared tokenizer (capped at 24 terms).
2. **Embed** — the query is embedded with the same model used for chunks.
3. **Dual retrieval** — vector search (`$vectorSearch`, `numCandidates` = 10× limit, cosine, `lectureId`/`courseId` applied as Atlas `filter`) and keyword search (`$in` over stored keywords, scored by distinct term matches, ordered deterministically) run concurrently.
4. **Fusion** — Reciprocal Rank Fusion (`k=60`) merges the two lists by rank into the top 12 chunks; scores never need normalization across modalities.
5. **Rerank** — one Gemini call ranks the 12 candidates down to the top 4 (temperature 0, JSON-schema output, indices validated against the candidate list).
6. **Generate** — one Gemini call with a system prompt restricting answers to the provided context; the model returns answer text plus the indices it used (JSON schema, temperature 0).
7. **Source mapping** — timestamps are attached from the chunk documents themselves, never inferred by the model; malformed/out-of-range indices are dropped, so sources can only cite chunks that were actually retrieved.
8. **Response** — `{ answer, sources }` is returned; no embeddings, raw scores, or internal structures are exposed to the client.

## Features

- **AI Tutor per lecture** — "Ask AI to Explain" answers questions grounded in the specific lecture's transcript, with timestamped sources; gracefully reports "still processing" or "not in this lecture" cases.
- **AI course search** — search terms are classified against the platform's taxonomy via a Gemini keyword call, with a regex DB search as primary and the classified keyword as fallback.
- **Course & lecture management** — educators create/edit/remove courses and lectures, set pricing/level/category, publish, and upload videos (Cloudinary signed-URL direct upload with progress bar).
- **Processing checklist UI** — educators watch the pipeline (transcribe → chunk → embed → index) via a polled, uncached status endpoint with server-driven stage order.
- **Authentication** — signup/login/logout, Google OAuth (Firebase), bcrypt password hashing, JWT in `httpOnly` cookie + Bearer header, role-based routing (`student` / `educator`).
- **Password reset** — 4-digit OTP (Redis-backed with Mongo fallback) delivered via Brevo transactional email.
- **Payments** — Razorpay order creation and server-side payment verification that enrolls the student and clears the affected caches.
- **Live classes** — per-course live sessions (ZegoUIKit, host/audience roles) with persistent live state; the educator's join/leave toggles the course's live flag, which students' course pages poll.
- **Course discussion** — a real-time Socket.io chat panel on each course page, open to enrolled students and the course educator. The handshake is JWT-authenticated, room joins are checked against enrollment, and the sender name/role/timestamp are stamped server-side so a client cannot post as someone else. Educator messages are badged.
- **Reviews & ratings** — one review per user per course, listed with user and course populated.
- **Enrollment** — paid enrollment via verified payment; enrolled course lists on both student and educator dashboards.

## Tech Stack

**Backend** — Node.js (ESM), Express 5, Mongoose 9, MongoDB Atlas (Vector Search + standard indexes), Redis (ioredis), Google Gemini (`@google/generative-ai`), js-tiktoken, JWT, bcrypt, Nodemailer/Brevo, Razorpay, Socket.io, Cloudinary, Multer.

**Frontend** — React 19, Vite 7, Tailwind CSS 4, Redux Toolkit, React Router 7, Axios, React Player, Firebase Auth, ZegoUIKit prebuilt, Socket.io client, Framer Motion, GSAP, Three.js / React Three Fiber, Recharts.

## Project Structure

```
Backend/
├── index.js                     # Express app, Socket.io server, route mounting
├── services/ai/
│   ├── ingestion/
│   │   ├── lecturePipeline.js   # Orchestrator: sequences stages, owns READY status
│   │   ├── transcriptionService.js   # Gemini File API upload + poll + transcribe
│   │   ├── sentenceSplitter.js  # Deterministic sentence splitter + topic boundaries
│   │   ├── semanticChunker.js   # Token-budget chunking with overlap
│   │   ├── chunkPipeline.js     # Transcript -> normalized -> chunks -> LectureChunk docs
│   │   ├── embeddingService.js  # Batched embeddings, bulkWrite, idempotent
│   │   └── keywordExtractor.js  # Shared tokenizer + term-frequency keywords
│   ├── retrieval/
│   │   ├── retrievalPipeline.js # Hybrid retrieval: vector + keyword -> RRF
│   │   ├── vectorSearch.js      # Atlas $vectorSearch (filter inside query)
│   │   ├── keywordSearch.js     # $in keyword matching + scoring
│   │   └── reciprocalRankFusion.js
│   ├── generation/
│   │   ├── reranker.js          # Gemini rerank (top 12 -> top 4)
│   │   └── answerGenerator.js   # Structured answer + source indices
│   └── providers/geminiProvider.js  # Shared Gemini client + model constants
├── controllers/                 # Auth, courses, lectures, search, orders, live, reviews
├── models/                      # User, Course, Lecture, LectureChunk, Review, LiveSession
├── middleware/                  # isAuth (JWT), multer (Cloudinary storage)
├── config/                      # Redis cache helpers, DB, Cloudinary, Socket.io
└── scripts/                     # backfillChunkKeywords.js, removeVerificationFixture.js

Frontend/
└── src/
    ├── pages/                   # Home, ViewCourse, SearchWithAi, Educator/*, LiveClass, ...
    ├── components/              # Navbar, AIExplainer, CourseChat, animated visual components
    ├── redux/                   # user/course/lecture/review slices (localStorage rehydrate)
    ├── customHooks/             # Session, course, review data fetching, useCourseChat
    └── config/
        ├── axiosClient.js       # Axios instance with auth interceptor
        └── socketClient.js      # Shared Socket.io client (token re-read per reconnect)

docs/atlas-vector-index.json     # Vector Search index definition (3072d, cosine, filters)
```

## Installation

Prerequisites: Node.js 20+, MongoDB Atlas (with the vector search index created per `docs/atlas-vector-index.json`), Redis, and API keys for Gemini, Cloudinary, Razorpay, Brevo, Firebase, and ZegoCloud.

```bash
# Backend
cd Backend
npm install
# create .env with the variables listed under Configuration
npm run dev                 # or: npm start

# Frontend
cd Frontend
npm install
# create .env with the VITE_* variables listed under Configuration
npm run dev                 # Vite dev server on :5173
```

> The Atlas vector index is created manually in the Atlas UI / Admin API — never from application code.

## Configuration

Environment variables are documented inline in the templates:

- **Backend** (`.env`): `PORT`, `NODE_ENV`, `MONGODB_URL`, `FRONTEND_URL`, `JWT_SECRET`, `REDIS_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `MAIL_HOST`, `USER_EMAIL`, `USER_PASSWORD`, `DEFAULT_COURSE_THUMBNAIL`, `BREVO_API_KEY`. Optional tunables read from `process.env`: `GEMINI_EMBED_BATCH_SIZE` (default 100), `GEMINI_MAX_POLL_ATTEMPTS` (default 60), `ATLAS_INDEX_TIMEOUT_MS` (default 90000), `ATLAS_VECTOR_INDEX` (default `lecture_chunk_vector_index`).
- **Frontend** (`.env`): `VITE_SERVER_URL`, `VITE_RAZORPAY_KEY_ID`, `VITE_ZEGO_APP_ID`, `VITE_ZEGO_SERVER_SECRET`, Firebase `VITE_FIREBASE_*` vars, `VITE_DEFAULT_COURSE_THUMBNAIL`.

## Usage

**Core AI endpoints** (all under `/api`):

| Endpoint | Description |
|---|---|
| `POST /course/explain-lecture` | AI Tutor: `{ lectureId, userQuestion }` → `{ answer, sources }` via hybrid RAG |
| `GET /course/lecture-status/:lectureId` | Pipeline progress: `{ status, stage, stages, message, chunkCount }` |
| `POST /course/search` | AI course search: `{ input }` → matching published courses |

**Ingestion scripts**:

```bash
node scripts/backfillChunkKeywords.js --dry-run   # preview keyword backfill
node scripts/backfillChunkKeywords.js             # run it
node scripts/removeVerificationFixture.js --dry-run
```

**Auth & data**: `/api/auth` (signup, login, logout, googleauth, sendotp, verifyotp, resetpassword), `/api/user` (getCurrentUser, profile), `/api/course` (course/lecture CRUD), `/api/order` (razorpay-order, verifypayment), `/api/review`, `/api/upload/signature`, `/api/live` (details, start).

**Realtime (Socket.io, same origin as `VITE_SERVER_URL`)**: the client connects with the JWT in `socket.auth.token` (Bearer header and `token` cookie also accepted); unauthenticated handshakes are rejected. Events:

| Event | Direction | Payload | Notes |
| :--- | :--- | :--- | :--- |
| `join_room` | client → server | `roomId` (course id) | Rejected unless the user is an enrolled student or the course educator |
| `room_joined` | server → client | `{ room }` | Sent on a successful join |
| `send_message` | client → server | `{ room, text }` | Only valid for rooms the socket has joined; text capped at 2000 chars |
| `receive_message` | server → client | `{ id, room, text, senderId, senderName, senderRole, senderPhotoUrl, createdAt }` | Broadcast to the whole room including the sender; identity is server-stamped |
| `chat_error` | server → client | `{ message }` | Join/rejoin failures, e.g. not enrolled |

## Performance Optimizations

- **Redis caching** — `getOrSetCache` with per-endpoint TTLs (1h home page, 24h course/lecture/creator), automatic DB fallback, and targeted invalidation on every relevant write (enrollment, review, course/lecture edits).
- **Index readiness probe** — the pipeline proves searchability before marking `READY`, eliminating the "READY but returns nothing" failure mode.
- **Batched, in-DB work** — embeddings in batches of 100 with a single `bulkWrite`; chunk inserts via `insertMany`; `$vectorSearch` runs inside Atlas (embeddings never cross the network); keyword selection happens in Mongo (`$in`) with scoring in the service.
- **Concurrency** — vector and keyword retrieval run in parallel; pipeline stages are idempotent and guarded against duplicate concurrent runs.
- **Fire-and-forget ingestion** — video transcription (minutes) never blocks the API response; the client polls an uncached status endpoint.
- **Streaming file download** — video is piped to disk instead of buffered in memory; temp files are cleaned up in `finally`.

## Known Limitations

- **No rate limiting** on public endpoints (auth, search, payment).
- **CORS is wide open** (`origin: true`, all origins) on the API.
- **Course chat is not persisted** — messages are relayed in memory by Socket.io and never written to MongoDB, so the transcript is empty on reload and members see only what arrives while they are connected. There is no chat history endpoint, typing indicator, or presence list.
- **Transcripts lack timestamps** — ingestion works from plain text, so `startTimestamp`/`endTimestamp` are 0 and sources link to the lecture, not to exact video positions.
- **Embeddings are stored in-document** (`[Number]`) rather than in a purpose-built vector store; the schema stores each vector as a MongoDB array.
- **Single-provider AI** — all AI calls (transcription, embeddings, reranking, generation) depend on Google Gemini; batch transcription is not parallelized (one lecture at a time).
- **Search & AI Tutor are per-lecture** — hybrid RAG answers questions about one lecture; there is no cross-course or course-level retrieval.
