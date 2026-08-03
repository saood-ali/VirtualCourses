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
[![Tests](https://img.shields.io/badge/integration%20tests-18%20passing-2ea44f)](#-testing)

</div>

VirtualCourses is a full-stack learning marketplace built around one idea: **the spoken content of a lecture video should be a first-class, queryable data structure — not an opaque blob behind a play button.**

Educators publish and monetize video courses. Students buy them, watch them, and — when they get stuck at 14:32 — ask a question in plain English and get an answer grounded in *that lecture's own transcript*, with the source chunks it was drawn from. Making that work required an automated ingestion pipeline (**transcribe → chunk → embed → index**) and a real retrieval stack: **hybrid vector + keyword search fused with Reciprocal Rank Fusion, a Gemini reranking pass, and schema-constrained answer generation.**

Around that core sits everything a production marketplace needs: JWT auth with Google OAuth, Razorpay enrollment, signed direct-to-CDN video uploads, live classes, a persisted real-time discussion layer, cache-aside Redis that degrades to MongoDB rather than failing, and an integration suite that boots a real `mongod` and real sockets instead of mocking them.

<div align="center">

**[🔗 Live Demo](https://virtualcourses.vercel.app)** · **[🔌 Backend API](https://project-1-c0c5.onrender.com)**

</div>

<!-- > [!NOTE]
> **Screenshots** — in-repo captures live in [Frontend/src/assets/](Frontend/src/assets/) (`home_page.png`, `about_image.png`, `interactive.png`, `ai_student.png`). Replace this block with a hosted banner for the GitHub social preview. -->

---

## 📑 Contents

[Why This Exists](#-why-this-project-exists) · [Architecture](#-architecture-overview) · [AI Architecture](#-ai-architecture) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Performance](#-performance) · [Testing](#-testing) · [Installation](#-installation) · [Environment Variables](#-environment-variables) · [API](#-api-overview) · [Security](#-security) · [Project Structure](#-project-structure) · [Documentation](#-documentation) · [Limitations & Roadmap](#-limitations--roadmap) · [Contributing](#-contributing) · [License](#-license) · [Author](#-author)

---

## 🎯 Why This Project Exists

Eleven real constraints shaped this codebase. In brief:

| # | Problem | Design response |
| :-: | :--- | :--- |
| 1 | Video lectures are unstructured data | Automated **transcribe → chunk → embed → index** ingestion pipeline |
| 2 | Traditional search can't read learning intent | Regex first, Gemini taxonomy classification only on a miss |
| 3 | Pure vector search is confidently wrong on exact terms | **Hybrid retrieval** fused by Reciprocal Rank Fusion |
| 4 | Retrieval alone is not precision | A dedicated **Gemini reranking pass** (12 → 4) |
| 5 | An LLM will cite a timestamp it invented | The model returns **indices only**; sources are attached server-side |
| 6 | "Ready" that isn't searchable is a silent failure | An `INDEXING` probe queries the live index before `READY` |
| 7 | Transcription takes minutes; HTTP requests don't | Fire-and-forget ingestion, idempotent stages, polled status |
| 8 | Repeated reads of near-static data waste latency | Cache-aside Redis, **optional**, degrades to MongoDB |
| 9 | Chat that forgets everything isn't a discussion | Persist before broadcast; cursor-paginated history |
| 10 | Client-trusted identity and pricing are not security | Server-stamped socket identity; DB-priced, re-verified payments |
| 11 | Rich interfaces shouldn't tax the API | Signed **direct-to-CDN** uploads; video never touches Node |

📖 **The full reasoning behind each one:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#-why-this-project-exists)

---

## 🏗 Architecture Overview

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

Every subsystem gets a problem → solution → design → impact write-up in the architecture document: hybrid RAG, LLM reranking, verifiable source attribution, deterministic ingestion, provable index readiness, cache-aside Redis, persisted real-time discussion, server-verified payments, signed CDN streaming, dual-path authentication, polling-over-sockets live classes, GPU-accelerated UI, and Redux state boundaries.

📖 **Subsystem deep dives and technical highlights:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🤖 AI Architecture

The AI layer turns each uploaded video into a retrievable knowledge base and answers lecture-scoped questions from it. Ingestion runs in the background — transcription via the Gemini File API, deterministic sentence-aware chunking on real `cl100k_base` token counts, 3072-dimensional embeddings written in batches, and an index-readiness probe that only sets `READY` once Atlas actually serves the lecture's own vector back. Every stage is idempotent, so a partial run is always safe to re-run.

At query time the platform spends **exactly two Gemini calls per question**. Vector and keyword search run concurrently and are fused by Reciprocal Rank Fusion (`k = 60`) into 12 candidates; one Gemini call reranks those to 4; one more generates a schema-constrained `{ answer, usedIndices }`. Timestamps and identifiers are attached server-side from the chunk documents, so **a citation can only ever point at a chunk that was genuinely retrieved.** Every AI boundary has an explicit fallback — no dependency failure returns a 500.

| Concern | Model | Configuration |
| :--- | :--- | :--- |
| **Transcription** | `GEMINI_MODEL` (env) | Gemini File API upload → bounded polling → verbatim prompt |
| **Embeddings** | `gemini-embedding-001` | **Hardcoded constant.** 3072 dimensions, batched 100 per request |
| **Reranking** | `GEMINI_MODEL` (env) | `temperature: 0`, `responseSchema`-constrained JSON |
| **Answer generation** | `GEMINI_MODEL` (env) | `temperature: 0`, JSON schema, context-restricted system prompt |
| **Search classification** | `GEMINI_MODEL` (env) | Constrained to a fixed category taxonomy, not free text |


📖 **Complete implementation** — stage-by-stage ingestion, the retrieval/generation flow diagram, search pipeline, `LectureChunk` data model, and the resilience matrix: **[docs/AI_PIPELINE.md](docs/AI_PIPELINE.md)**

---

## ✨ Features

### 🤖 AI

| Feature | Description |
| :--- | :--- |
| **In-lecture AI tutor** | An "Ask AI to Explain" panel inside the player ([AIExplainer.jsx](Frontend/src/components/AIExplainer.jsx)) answers questions grounded in the specific lecture's transcript, with sources. Handles "still processing" and "not in this lecture" explicitly rather than guessing. |
| **Hybrid RAG retrieval** | Vector + keyword search fused by RRF, Gemini-reranked, with verifiable source attribution. |
| **Natural-language course search** | [SearchWithAi](Frontend/src/pages/SearchWithAi.jsx) maps free-text intent onto the platform taxonomy — regex first, Gemini only on miss. |
| **Automated transcription** | Every uploaded video is transcribed in the background with no manual step. |
| **Processing checklist UI** | Educators watch transcribe → chunk → embed → index progress via a polled, uncached status endpoint with server-driven stage order. |

### 🎓 Student

| Feature | Description |
| :--- | :--- |
| **Course player** | Native `<video>` with YouTube-style shortcuts (`k`/`space`, `j`/`l`, arrows, `f`, `m`, `p`), Picture-in-Picture, and auto-advance to the next unlocked lecture. |
| **Resume playback** | Per-lecture position persisted to `localStorage` — no server round trip. |
| **Enrollment & library** | Paid enrollment via verified payment; enrolled courses listed on the dashboard. |
| **Reviews & ratings** | One 1–5 review per user per course, listed with user and course populated. |
| **Free previews** | Educator-flagged preview lectures playable before purchase. |

### 🎨 Educator

| Feature | Description |
| :--- | :--- |
| **Course & lecture management** | Full CRUD over courses and lectures — pricing, level, category, publish state. |
| **Direct-to-CDN uploads** | Signed Cloudinary uploads with a real progress bar; video never touches the API. |
| **Analytics dashboard** | Earnings (`price × enrolled`), student counts, and published-course totals with Recharts distributions — derived from existing Redux state, so no analytics endpoint is needed at this scale. |
| **Live class hosting** | Host role in the ZegoUIKit room; join/leave toggles the course's live flag. |

### 📡 Real-time

| Feature | Description |
| :--- | :--- |
| **Course discussion** | Persisted Socket.io chat per course, open to enrolled students and the course educator. Transcript survives reload; late joiners see prior messages; older messages page in on demand. Educator messages are badged. |
| **Typing indicators** | Relayed to everyone in the room except the sender; never stored. |
| **Presence** | Live online-member list, deduplicated per user, emitted on join, leave, and disconnect. |
| **Live classes** | ZegoUIKit rooms with host/audience roles and persistent live state, surfaced as a badge via a 30 s poll. |

### 🔐 Authentication

| Feature | Description |
| :--- | :--- |
| **Email/password** | bcrypt hashing (cost 10), JWT in `httpOnly` cookie **and** Bearer header. |
| **Google OAuth** | Firebase popup exchanged for the application's own JWT. |
| **OTP password reset** | 4-digit OTP, 5-minute Redis TTL with MongoDB fallback, delivered via Brevo. Two-step: reset refuses unless `isOtpVerified`. |
| **Role-based routing** | `student` / `educator` guards on both client routes and API mutations. |

### 💳 Payments & Media

| Feature | Description |
| :--- | :--- |
| **Razorpay enrollment** | Server-side order creation from the database price, re-verified against Razorpay before enrollment. |
| **Cache invalidation on purchase** | Enrolling invalidates the user profile, educator stats, and course page in one call. |
| **Cloudinary media** | Signed direct upload for video, server-proxied multipart for images, CDN delivery, old-image cleanup on profile update. |

---

## 🛠 Tech Stack

**Frontend** — React 19 · Vite 7 · Tailwind CSS 4 · Redux Toolkit + React-Redux · React Router 7

| Library | Used for |
| :--- | :--- |
| **Axios** | One configured instance with `withCredentials` and a token interceptor. |
| **Socket.io client** | Course discussion transport. |
| **Firebase (Web SDK)** | Google OAuth popup only; the app issues its own JWT. |
| **ZegoCloud UIKit Prebuilt** | Drop-in live classroom — no hand-rolled WebRTC signaling or TURN. |
| **Recharts** | SVG charts for the educator analytics dashboard. |
| **React Player** | Media preview in the lecture editor. |
| **Motion** (`motion/react`) · **OGL** | Layout/scroll animation; single-shader `Iridescence` background. |
| **Lucide React** · React Icons · React Toastify · React Spinners | Icons, notifications, loading states. |
| **clsx** + **tailwind-merge** | Conditional classes without duplicate-utility conflicts. |
| **ESLint 9** | Flat config with React Hooks and Refresh rules. |

**Backend** — Node.js 20+ (ESM) · Express 5 · Mongoose 9 · Socket.io 4

| Library | Used for |
| :--- | :--- |
| **jsonwebtoken** + **bcrypt** | Stateless auth; password hashing at cost 10. |
| **Multer** + multer-storage-cloudinary | Server-proxied image multipart with format allowlisting. |
| **validator** · **otp-generator** | Email validation at signup; 4-digit reset OTPs. |
| **cors** · **cookie-parser** · **dotenv** · **nodemon** | Credentialed CORS, `httpOnly` cookies, config, dev restart. |

**AI & data**

| Technology | Used for |
| :--- | :--- |
| **@google/generative-ai** | One SDK for transcription (File API), reranking, generation, and batch embeddings. |
| **`gemini-embedding-001`** | 3072-dim embeddings, **frozen as a code constant** — see [AI Architecture](#-ai-architecture). |
| **js-tiktoken** | Real `cl100k_base` counts, so chunk boundaries are exact and reproducible. |
| **MongoDB Atlas + Vector Search** | Documents and 3072-dim cosine ANN in one store, filtered by `lectureId` / `courseId`. |
| **Redis (ioredis)** | Cache-aside reads and OTP TTLs — **optional**, degrades to MongoDB rather than crashing. |

**Services & hosting** — **Cloudinary** (signed direct-to-CDN uploads, media delivery) · **Razorpay** (server-created, re-verified payments) · **Brevo** (transactional email over HTTP, since PaaS hosts block SMTP) · **Firebase Auth** (Google OAuth) · **ZegoCloud** (live classes) · **Vercel** (frontend) · **Render** (API)

---


<!-- ## 🧪 Testing

The course-discussion surface has an **18-test integration suite** on the Node.js built-in test runner. It boots a throwaway `mongod` on a free port, mounts the real chat route, starts the real Socket.io server, and drives it with real `socket.io-client` connections.

**Nothing is mocked or stubbed — so a pass means the persistence path actually works end to end.**

```bash
cd Backend
npm test        # node --test "tests/**/*.test.js"
```

Requires a local `mongod` binary on `PATH`; the suite spawns and tears down its own instance in a temp dir, so **your real database is never touched**. `JWT_SECRET` defaults to a test value if unset.

**Coverage:**

| Area | What is verified |
| :--- | :--- |
| **Persistence** | Messages survive a reload; late joiners see prior history. |
| **Pagination** | Cursor paging and correct `hasMore` derivation. |
| **Authorization** | The 401/403/400 paths, including non-enrolled access. |
| **Identity spoofing** | A forged sender payload is overridden by socket identity. |
| **Input limits** | Over-long messages are rejected. |
| **Fan-out** | Broadcast reaches the whole room, including the sender. |
| **Presence** | Join, leave, disconnect — and the two-tabs-one-user case. |
| **Typing** | Relay excludes the sender. |
| **Failure path** | On a write failure, **nothing is broadcast** and the sender gets `chat_error`. |

--- -->

## 🚀 Installation

### Prerequisites

- **Node.js 20+**
- **MongoDB Atlas** cluster with the vector index created per [docs/atlas-vector-index.json](docs/atlas-vector-index.json)
- **Redis** *(optional — the app runs without it)*
- API keys for **Gemini**, **Cloudinary**, **Razorpay**, **Brevo**, **Firebase**, and **ZegoCloud**

### Setup

```bash
git clone https://github.com/saood-ali/VirtualCourses.git
cd VirtualCourses

# Backend  → http://localhost:8000
cd Backend
npm install
#   create .env — see Environment Variables
npm run dev            # nodemon · or: npm start

# Frontend → http://localhost:5173
cd ../Frontend
npm install
#   create .env — see Environment Variables
npm run dev            # or: npm run build · npm run preview · npm run lint
```

### Enable Vector Search

In Atlas: **Atlas Search → Create Search Index → JSON Editor → Vector Search**, target the `lecturechunks` collection, paste [docs/atlas-vector-index.json](docs/atlas-vector-index.json), and name it `lecture_chunk_vector_index`.


<!-- ### Maintenance scripts

```bash
node scripts/backfillChunkKeywords.js --dry-run     # preview keyword backfill
node scripts/backfillChunkKeywords.js               # run it
node scripts/removeVerificationFixture.js --dry-run
``` -->

---

<!-- ## 🔑 Environment Variables

### Backend — `Backend/.env`

| Variable | Purpose | Required |
| :--- | :--- | :---: |
| `PORT` | HTTP listen port. | ⬜ |
| `NODE_ENV` | Environment label. | ⬜ |
| `MONGODB_URL` | MongoDB connection string. The process exits if the connection fails. | ✅ |
| `FRONTEND_URL` | Deployed frontend origin; added to the Socket.io allowed-origins list. | ✅ |
| `JWT_SECRET` | Signing/verification key for all JWTs. Use a long random value. | ✅ |
| `REDIS_URL` | Redis connection URL. **Omit to disable caching** — the app degrades to direct DB reads. | ⬜ |
| `GEMINI_API_KEY` | Google AI key for transcription, embeddings, reranking, and generation. | ✅ |
| `GEMINI_MODEL` | Generative model ID. *(Embeddings are pinned in code, not here.)* | ✅ |
| `CLOUDINARY_NAME` | Cloudinary cloud name. | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key (returned to clients for signed uploads). | ✅ |
| `CLOUDINARY_API_SECRET` | Signs upload requests. **Server-only — never expose.** | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay public key ID. | ✅ |
| `RAZORPAY_KEY_SECRET` | Order creation and verification. **Server-only.** | ✅ |
| `BREVO_API_KEY` | Brevo transactional email API key. | ✅ |
| `MAIL_HOST` | SMTP host (legacy mail path). | ⬜ |
| `USER_EMAIL` | Verified Brevo sender address for OTP emails. | ✅ |
| `USER_PASSWORD` | SMTP credential (legacy mail path). | ⬜ |
| `DEFAULT_COURSE_THUMBNAIL` | Fallback thumbnail URL. | ⬜ |

**Optional AI tunables** — read from `process.env` with sensible defaults:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `GEMINI_EMBED_BATCH_SIZE` | `100` | Chunks per embedding request. |
| `GEMINI_MAX_POLL_ATTEMPTS` | `60` | Max 2-second polls for Gemini file processing (~2 min). |
| `ATLAS_INDEX_TIMEOUT_MS` | `90000` | How long the readiness probe waits before marking `READY` anyway. |
| `ATLAS_VECTOR_INDEX` | `lecture_chunk_vector_index` | Vector index name. |

### Frontend — `Frontend/.env`

> [!CAUTION]
> Every `VITE_`-prefixed variable is **compiled into the public client bundle**. Firebase and Razorpay *public* keys are designed for this. `VITE_ZEGO_SERVER_SECRET` is **not** — see [gap #8](docs/SECURITY.md#known-gaps).

| Variable | Purpose | Required |
| :--- | :--- | :---: |
| `VITE_SERVER_URL` | Backend base URL for Axios and the Socket.io client. | ✅ |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key for the checkout widget. | ✅ |
| `VITE_ZEGO_APP_ID` | ZegoCloud application ID. | ✅ |
| `VITE_ZEGO_SERVER_SECRET` | Zego token generation. ⚠️ **A real secret currently client-side.** | ✅ |
| `VITE_FIREBASE_APIKEY` | Firebase Web API key (public by design). | ✅ |
| `VITE_FIREBASE_AUTHDOMAIN` | Firebase auth domain for the OAuth popup. | ✅ |
| `VITE_FIREBASE_PROJECTID` | Firebase project ID. | ✅ |
| `VITE_FIREBASE_STORAGEBUCKET` | Firebase storage bucket. | ✅ |
| `VITE_FIREBASE_MESSAGINGSENDERID` | Firebase messaging sender ID. | ✅ |
| `VITE_FIREBASE_APPID` | Firebase app ID. | ✅ |
| `VITE_FIREBASE_MEASUREMENTID` | Firebase Analytics measurement ID. | ⬜ |
| `VITE_DEFAULT_COURSE_THUMBNAIL` | Client-side fallback thumbnail URL. | ⬜ |

--- -->

<!-- ## 📡 API Overview

Base URL `<VITE_SERVER_URL>` · JSON responses · 🔓 public · 🔒 requires `isAuth`

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/course/explain-lecture` | **AI Tutor.** `{ lectureId, userQuestion }` → `{ answer, sources }` via hybrid RAG → rerank → generate. | 🔒 |
| `GET` | `/api/course/lecture-status/:lectureId` | **Pipeline progress.** `{ status, stage, stages, message, chunkCount }`. Uncached by design — polled every 3 s. | 🔒 |
| `POST` | `/api/course/search` | **AI course search.** `{ input }` → matching published courses. Regex first, Gemini classification on miss. | 🔒 |

Auth, user, course/lecture CRUD, payments, reviews, uploads, live sessions, cursor-paginated chat history, and the full Socket.io event contract are documented in the API reference.

📖 **Full endpoint and event reference:** [docs/API.md](docs/API.md)

---

## 🔒 Security

Implemented: bcrypt (cost 10) password hashing, `jwt.verify()` on every protected route, `httpOnly` `secure` `sameSite: "none"` cookies, `.select("-password")` on profile reads, rejected unauthenticated socket handshakes, server-stamped chat identity, one shared authorization helper across socket and REST, creator-ownership checks on `editCourse`, database-priced and re-verified Razorpay orders, short-lived HMAC upload signatures, single-use 5-minute OTPs, a two-step reset flow, message and body size caps, upload format allowlisting, taxonomy-constrained AI output, embeddings excluded from every response, and git-ignored secrets.

> [!CAUTION]
> **11 known gaps are documented deliberately** — wide-open CORS, unauthenticated payment routes, a client-supplied `userId` on verify, missing Razorpay HMAC validation, missing ownership checks on delete, a `localStorage` token, a 100-day JWT expiry, the client-side Zego secret, no rate limiting, unsanitized prompt interpolation, and unvalidated OAuth `role`. **Address these before any production deployment.**

📖 **Full controls table and every gap with location, impact, and fix:** [docs/SECURITY.md](docs/SECURITY.md)

--- -->

## 📁 Project Structure

```
VirtualCourses/
├── Backend/                    # Express 5 API (ESM)
│   ├── services/ai/            # ⭐ ingestion · retrieval · generation · providers
│   ├── controllers/            # auth, user, course, search, order, live, review, chat
│   ├── models/                 # User, Course, Lecture, LectureChunk, Review, LiveSession, ChatMessage
│   ├── routes/ middleware/     # Thin URL → controller mapping; isAuth, multer
│   ├── config/ utils/          # redis, connectDB, token, cloudinary, sendMail, socketHandler, courseAccess
│   ├── tests/ scripts/         # Integration suite (real mongod + sockets); backfill/maintenance
├── Frontend/                   # React 19 SPA — pages, components, redux, customHooks, config
├── docs/                       # Detailed documentation (below) + atlas-vector-index.json

```

📖 **Fully annotated tree, module-by-module, plus why the AI layer is structured this way:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#-project-structure)

---

## 📚 Documentation

| Document | Contents |
| :--- | :--- |
| **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** | The eleven problems that shaped the system, runtime topology, thirteen subsystem deep dives, technical highlights, and the annotated project structure. |
| **[docs/AI_PIPELINE.md](docs/AI_PIPELINE.md)** | Provider layer and frozen constants, the full ingestion pipeline, retrieval and generation flow, search pipeline, `LectureChunk` data model, and the resilience matrix. |
| **[docs/API.md](docs/API.md)** | Every REST endpoint with auth requirements, plus the complete Socket.io event contract. |

---


## 👤 Author

**Saood Ali** — Full-stack engineer working on applied AI systems, distributed architecture, and the MERN stack.

- GitHub: [@saood-ali](https://github.com/saood-ali)
- LinkedIn: [saood-ali](https://www.linkedin.com/in/saood-ali)
<!-- - Portfolio: [your-site.com](https://your-site.com) -->

---

<div align="center">

**Built with React 19, Express 5, MongoDB Atlas Vector Search, and Google Gemini.**

⭐ Star this repository if you find it useful.

</div>


