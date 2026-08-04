<div align="center">

# Features

### Every user-facing capability, and where it lives in the codebase.

**[README](../README.md)** · **[Architecture](ARCHITECTURE.md)** · **[AI Pipeline](AI_PIPELINE.md)**

</div>

---

## AI

| Feature | Description |
| :--- | :--- |
| **In-lecture AI tutor** | An "Ask AI to Explain" panel inside the player ([AIExplainer.jsx](../Frontend/src/components/AIExplainer.jsx)) answers questions grounded in that lecture's transcript, with sources. Handles "still processing" and "not in this lecture" explicitly rather than guessing. |
| **Hybrid RAG retrieval** | Vector + keyword search fused by RRF, Gemini-reranked, with verifiable source attribution. |
| **Natural-language course search** | [SearchWithAi](../Frontend/src/pages/SearchWithAi.jsx) maps free-text intent onto the platform taxonomy — regex first, Gemini only on miss. |
| **Automated transcription** | Every uploaded video is transcribed in the background with no manual step. |
| **Processing checklist UI** | Educators watch transcribe → chunk → embed → index progress via a polled, uncached status endpoint with server-driven stage order. |

---

## Student

| Feature | Description |
| :--- | :--- |
| **Course player** | Native `<video>` with YouTube-style shortcuts (`k`/`space`, `j`/`l`, arrows, `f`, `m`, `p`), Picture-in-Picture, and auto-advance to the next unlocked lecture. |
| **Resume playback** | Per-lecture position persisted to `localStorage` — no server round trip. |
| **Enrollment & library** | Paid enrollment via verified payment; enrolled courses listed on the dashboard. |
| **Reviews & ratings** | One 1–5 review per user per course, listed with user and course populated. |
| **Free previews** | Educator-flagged preview lectures playable before purchase. |

---

## Educator

| Feature | Description |
| :--- | :--- |
| **Course & lecture management** | Full CRUD over courses and lectures — pricing, level, category, publish state. |
| **Direct-to-CDN uploads** | Signed Cloudinary uploads with a real progress bar; video never touches the API. |
| **Analytics dashboard** | Earnings (`price × enrolled`), student counts, and published-course totals with Recharts distributions — derived from existing Redux state, so no analytics endpoint is needed at this scale. |
| **Live class hosting** | Host role in the ZegoUIKit room; join/leave toggles the course's live flag. |

---

## Real-time

| Feature | Description |
| :--- | :--- |
| **Course discussion** | Persisted Socket.io chat per course, open to enrolled students and the course educator. Transcript survives reload; late joiners see prior messages; older messages page in on demand. Educator messages are badged. |
| **Typing indicators** | Relayed to everyone in the room except the sender; never stored. |
| **Presence** | Live online-member list, deduplicated per user, emitted on join, leave, and disconnect. |
| **Live classes** | ZegoUIKit rooms with host/audience roles and persistent live state, surfaced as a badge via a 30 s poll. |

---

## Authentication

| Feature | Description |
| :--- | :--- |
| **Email/password** | bcrypt hashing (cost 10), JWT in `httpOnly` cookie **and** Bearer header. |
| **Google OAuth** | Firebase popup exchanged for the application's own JWT. |
| **OTP password reset** | 4-digit OTP, 5-minute Redis TTL with MongoDB fallback, delivered via Brevo. Two-step: reset refuses unless `isOtpVerified`. |
| **Role-based routing** | `student` / `educator` guards on both client routes and API mutations. |

---

## Payments & Media

| Feature | Description |
| :--- | :--- |
| **Razorpay enrollment** | Server-side order creation from the database price, re-verified against Razorpay before enrollment. |
| **Cache invalidation on purchase** | Enrolling invalidates the user profile, educator stats, and course page in one call. |
| **Cloudinary media** | Signed direct upload for video, server-proxied multipart for images, CDN delivery, old-image cleanup on profile update. |

---

<div align="center">

**[Back to README](../README.md)**

</div>
