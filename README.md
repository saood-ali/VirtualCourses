<div align="center">

# VirtualCourses

### An AI-powered course marketplace where lecture video becomes searchable, citable knowledge.

[![React](https://img.shields.io/badge/React-19-087EA4?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20%20ESM-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Vector%20Search-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/products/platform/atlas-vector-search)
[![Redis](https://img.shields.io/badge/Redis-ioredis-FF4438?logo=redis&logoColor=white)](https://github.com/redis/ioredis)
[![Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio&logoColor=white)](https://socket.io)

**[Live](https://virtualcourses.vercel.app)**

</div>

VirtualCourses is a full-stack learning marketplace built around one idea: **the spoken content of a lecture video should be a first-class, queryable data structure — not an opaque blob behind a play button.**

Educators publish and monetize video courses. Students buy them, watch them, and — when they get stuck at 14:32 — ask a question in plain English and get an answer grounded in *that lecture's own transcript*, with the source chunks it was drawn from. Around that core sits everything a production marketplace needs: JWT auth with Google OAuth, Razorpay enrollment, signed direct-to-CDN uploads, live classes, and a persisted real-time discussion layer.

---

## Why This Project Exists

### The problem

**Every course platform stores its most valuable asset in its least usable form.**

A 40-minute lecture contains the exact explanation a student needs. As an MP4, it is opaque — it cannot be searched, quoted, filtered, or reasoned over. So when a student stalls at 14:32 on *why does `useEffect` run twice*, the platform's entire answer is a scrub bar and a guess.

What happens next is the real cost. The student leaves — for a search engine, a forum, or a general-purpose chatbot that has never seen the lecture and answers from the open internet rather than from what their instructor actually taught. The answer they needed was in the course they already paid for. The platform simply had no way to reach it.

Bolting a chatbot onto the player does not fix this. Doing it honestly means surviving three failure modes that quietly ruin naive implementations:

- **Semantic search alone is confidently wrong.** Embeddings capture meaning but blur specifics — ask about `useEffect` and cosine similarity cheerfully returns a passage about lifecycle methods in general. Close, and useless.
- **An LLM will invent its citations.** Ask a model for the timestamp it drew from and it will produce a plausible one whether or not that moment exists. An unverifiable citation is worse than none — it is a wrong answer wearing evidence.
- **"Ready" that isn't searchable is a silent failure.** Transcription takes minutes and vector indexes build asynchronously. Marking a lecture ready too early yields the worst bug available: a UI that says *ready*, a search that returns nothing, and no error anywhere.

### How VirtualCourses solves it

The platform treats **the spoken content of a lecture as a first-class, queryable data structure** rather than a blob behind a play button — and it enforces that end to end.

**1 · Every video becomes a knowledge base, automatically.** On upload, a background pipeline runs **transcribe → chunk → embed → index**: Gemini File API transcription, deterministic sentence-aware chunking on real `cl100k_base` token counts, 3072-dimensional embeddings, and an Atlas Vector Search index. No manual step, no educator effort.

**2 · Retrieval is hybrid, so it is right about both meaning and literals.** Vector search and deterministic keyword search run concurrently and are fused by **Reciprocal Rank Fusion** — merging by *rank* rather than score, so two incomparable scoring systems combine with no normalization hack. A dedicated Gemini reranking pass then cuts 12 candidates to the 4 that actually answer the question.

**3 · Citations are structurally verifiable.** The model never emits a timestamp. It returns **indices only**, into the exact candidate set it was handed; the server maps those back to chunk documents and reads timestamps from the documents themselves. Out-of-range indices are dropped. **A citation can only ever point at a chunk that was genuinely retrieved.**

**4 · Status means what it says.** An `INDEXING` stage probes the live index with one of the lecture's *own* embeddings, scoped to its own `lectureId`, and only sets `READY` once Atlas actually serves that vector back. Ingestion is fire-and-forget and every stage is idempotent, so a partial run is always safe to re-run while the client polls a deliberately uncached status endpoint.

The result: a student stuck at 14:32 asks in plain English and gets an answer grounded in *that lecture's own transcript*, with the source chunks it came from — at a cost of **exactly two Gemini calls per question**, because retrieval, fusion, chunking, and keyword extraction are all deterministic.

Around that core sits the rest of a real marketplace — auth, payments, uploads, live classes, discussion — where the same principle applies: **identity, pricing, and readiness are established server-side, never taken on the client's word.**

**The eleven constraints that shaped the codebase, each with its full reasoning:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#why-this-project-exists)

---

## Architecture

A React 19 SPA on Vercel talks to an Express 5 (ESM) API on Render over REST and Socket.io, both JWT-authenticated. Video bypasses the API entirely — the client uploads straight to Cloudinary with a server-signed request — and live classes run peer-to-peer through ZegoCloud.

The API layer is `routes → controllers → services`. MongoDB Atlas stores documents *and* 3072-dimensional vectors in one place via Vector Search. Redis is cache-aside and **optional**: if it is absent or unreachable, reads fall through to MongoDB instead of failing. Google Gemini serves three distinct roles — File API transcription, `embedContent` vectors, and `generateContent` for reranking and answer generation. Razorpay handles payments, Brevo sends OTP mail over HTTP, and Firebase provides the Google OAuth popup only.

**Runtime topology and thirteen subsystem deep dives:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## AI Architecture

Ingestion runs in the background: transcription via the Gemini File API, deterministic sentence-aware chunking on real `cl100k_base` token counts, 3072-dimensional embeddings written in batches, and an index-readiness probe that only sets `READY` once Atlas serves the lecture's own vector back. Every stage is idempotent.

At query time the platform spends **exactly two Gemini calls per question**. Vector and keyword search run concurrently and are fused by Reciprocal Rank Fusion (`k = 60`) into 12 candidates; one call reranks those to 4, one more generates a schema-constrained `{ answer, usedIndices }`. Timestamps are attached server-side from the chunk documents. Every AI boundary has an explicit fallback — no dependency failure returns a 500.

| Concern | Model | Configuration |
| :--- | :--- | :--- |
| **Transcription** | `GEMINI_MODEL` (env) | Gemini File API upload → bounded polling → verbatim prompt |
| **Embeddings** | `gemini-embedding-001` | **Hardcoded constant.** 3072 dimensions, batched 100 per request |
| **Reranking** | `GEMINI_MODEL` (env) | `temperature: 0`, `responseSchema`-constrained JSON |
| **Answer generation** | `GEMINI_MODEL` (env) | `temperature: 0`, JSON schema, context-restricted system prompt |
| **Search classification** | `GEMINI_MODEL` (env) | Constrained to a fixed category taxonomy, not free text |

**Stage-by-stage ingestion, retrieval flow, data model, and resilience matrix:** [docs/AI_PIPELINE.md](docs/AI_PIPELINE.md)

---

## Key Features

### AI-Grounded Learning
- **In-Lecture AI Tutor:** Ask a question mid-video and get an answer drawn from that lecture's transcript, with verifiable source citations.
- **Hybrid RAG Retrieval:** Vector + keyword search fused by Reciprocal Rank Fusion, then Gemini-reranked for precision.
- **Automated Transcription:** Every upload is transcribed, chunked, embedded, and indexed in the background — zero educator effort.
- **Natural-Language Course Search:** Free-text intent mapped onto the platform taxonomy; regex first, Gemini only on miss.

### Marketplace & Classroom
- **Course Player:** Native video with YouTube-style shortcuts, Picture-in-Picture, resume playback, and auto-advance.
- **Educator Studio:** Full course/lecture CRUD, signed direct-to-CDN uploads with progress, and a Recharts analytics dashboard.
- **Enrollment & Payments:** Razorpay orders created from the database price and re-verified server-side before access is granted.
- **Live Classes:** ZegoUIKit rooms with host/audience roles and a persistent live badge.

### Real-Time & Platform
- **Persisted Course Discussion:** Socket.io chat that survives reload, pages in history, and badges educator messages.
- **Presence & Typing Indicators:** Deduplicated online-member lists; typing relayed to everyone but the sender.
- **Secure Authentication:** JWT over `httpOnly` cookies, Google OAuth via Firebase, and OTP password reset with Redis TTL.
- **Graceful Degradation:** Cache-aside Redis is optional — the platform falls back to MongoDB rather than failing.

**Every feature in full detail, with source links:** [docs/FEATURES.md](docs/FEATURES.md)

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Redux Toolkit, React Router 7, Motion, OGL, Recharts, Axios |
| **Backend** | Node.js 20 (ESM), Express 5, Mongoose 9, Socket.io 4, JWT, bcrypt, Multer |
| **AI & Data** | Google Gemini (`@google/generative-ai`), `gemini-embedding-001`, js-tiktoken, MongoDB Atlas Vector Search, Redis (ioredis) |
| **Services** | Cloudinary (signed CDN uploads), Razorpay (payments), Brevo (email), Firebase Auth (OAuth), ZegoCloud (live classes) |
| **DevOps & Testing** | Vercel (frontend), Render (API), Node.js built-in test runner, real `mongod` + Socket.io integration suite |

---

## Quick Start

### Prerequisites

- **Node.js 20+**
- **MongoDB Atlas** cluster with the vector index created per [docs/atlas-vector-index.json](docs/atlas-vector-index.json)
- **Redis** *(optional — the app runs without it)*
- API keys for **Gemini**, **Cloudinary**, **Razorpay**, **Brevo**, **Firebase**, and **ZegoCloud**

### 1. Clone the repository

```bash
git clone https://github.com/saood-ali/VirtualCourses.git
cd VirtualCourses
```

### 2. Configure Backend

Create a `.env` file in the `Backend/` directory:

```env
PORT=8000
MONGODB_URL=your_mongodb_atlas_connection_string
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_super_secret_jwt_key
REDIS_URL=your_redis_url          # optional
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
BREVO_API_KEY=your_brevo_api_key
USER_EMAIL=your_verified_sender_email
```

```bash
cd Backend
npm install
npm run dev            
```

### 3. Configure Frontend

Create a `.env` file in the `Frontend/` directory:

```env
VITE_SERVER_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_ZEGO_APP_ID=your_zego_app_id
VITE_ZEGO_SERVER_SECRET=your_zego_server_secret
VITE_FIREBASE_APIKEY=your_firebase_api_key
VITE_FIREBASE_AUTHDOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECTID=your_firebase_project_id
VITE_FIREBASE_STORAGEBUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGINGSENDERID=your_firebase_sender_id
VITE_FIREBASE_APPID=your_firebase_app_id
```

```bash
cd Frontend
npm install
npm run dev           
```

### 4. Enable Vector Search

In Atlas: **Atlas Search → Create Search Index → JSON Editor → Vector Search**, target the `lecturechunks` collection, paste [docs/atlas-vector-index.json](docs/atlas-vector-index.json), and name it `lecture_chunk_vector_index`.

---

## Documentation

| Document | Contents |
| :--- | :--- |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | The eleven constraints that shaped the system, runtime topology, thirteen subsystem deep dives, and technical highlights. |
| **[docs/AI_PIPELINE.md](docs/AI_PIPELINE.md)** | Provider layer and frozen constants, the full ingestion pipeline, retrieval and generation flow, search pipeline, `LectureChunk` data model, and the resilience matrix. |
| **[docs/FEATURES.md](docs/FEATURES.md)** | Every user-facing feature across AI, student, educator, real-time, auth, and payments — with source links. |

---

## Author

**Saood Ali** — Full-stack engineer working on applied AI systems, distributed architecture, and the MERN stack.

- GitHub: [@saood-ali](https://github.com/saood-ali)
- LinkedIn: [saood-ali](https://www.linkedin.com/in/saood-ali)

---

<div align="center">

**Built with React 19, Express 5, MongoDB Atlas Vector Search, and Google Gemini.**

Star this repository if you find it useful.

</div>
