# API Reference

> Part of the [VirtualCourses](../README.md) documentation. See also:
> [Architecture](ARCHITECTURE.md) · [AI Pipeline](AI_PIPELINE.md) · [Performance](PERFORMANCE.md) · [Security](SECURITY.md) · [Limitations & Roadmap](ROADMAP.md)

Base URL `<VITE_SERVER_URL>` · JSON responses · 🔓 public · 🔒 requires `isAuth`

---

## 📑 Contents

[Core AI endpoints](#-core-ai-endpoints) · [Auth & user](#auth--user) · [Courses & lectures](#courses--lectures--apicourse) · [Payments, reviews, uploads, live](#payments-reviews-uploads-live) · [Chat history](#chat-history--apichat) · [Socket.io events](#socketio-events)

---

## ⭐ Core AI endpoints

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/course/explain-lecture` | **AI Tutor.** `{ lectureId, userQuestion }` → `{ answer, sources }` via hybrid RAG → rerank → generate. | 🔒 |
| `GET` | `/api/course/lecture-status/:lectureId` | **Pipeline progress.** `{ status, stage, stages, message, chunkCount }`. Uncached by design — polled every 3 s. | 🔒 |
| `POST` | `/api/course/search` | **AI course search.** `{ input }` → matching published courses. Regex first, Gemini classification on miss. | 🔒 |

## Auth & user

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` · `/login` · `/logout` | Email/password with bcrypt; returns a JWT and sets the cookie. | 🔓 |
| `POST` | `/api/auth/googleauth` | Exchanges a Firebase Google profile for an app JWT; creates the user on first sign-in. | 🔓 |
| `POST` | `/api/auth/sendotp` · `/verifyotp` · `/resetpassword` | 4-digit OTP (Redis 5-min TTL, Mongo fallback) via Brevo. Reset requires `isOtpVerified`. | 🔓 |
| `GET` | `/api/user/getCurrentUser` | Authenticated profile with populated enrollments, minus the password. | 🔒 |
| `POST` | `/api/user/profile` | Updates name, description, avatar. Destroys the previous Cloudinary image. | 🔒 |

## Courses & lectures — `/api/course`

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/getpublished` | Published catalog with populated lectures and reviews. Cached 1 h. | 🔓 |
| `POST` | `/create` · `/editcourse/:courseId` | Course CRUD. `editcourse` enforces creator ownership. | 🔒 |
| `GET` | `/getcourse/:courseId` · `/getcreator` · `/creator` | Course and creator reads. Cached 24 h. | 🔒 |
| `GET` | `/courselecture/:courseId` | Course with populated lectures — **the heaviest cached query.** | 🔒 |
| `POST` | `/createlecture/:courseId` · `/editlecture/:lectureId` | Lecture CRUD. **A new video resets status to `UPLOADED` and fires the background pipeline.** | 🔒 |
| `DELETE` | `/remove/:courseId` · `/removelecture/:lectureId` | Deletion. ⚠️ No ownership check — [gap #5](SECURITY.md#known-gaps). | 🔒 |

## Payments, reviews, uploads, live

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/order/razorpay-order` | Creates an order from the **database** price. ⚠️ Unauthenticated — [gap #2](SECURITY.md#known-gaps). | 🔓 |
| `POST` | `/api/order/verifypayment` | Re-fetches the order and enrolls if `paid`. ⚠️ Trusts body `userId` — [gaps #2–4](SECURITY.md#known-gaps). | 🔓 |
| `POST` `GET` | `/api/review/createreview` · `/getreview` | One review per user per course; invalidates four cache keys. | 🔒 / 🔓 |
| `GET` | `/api/upload/signature` | HMAC signature for direct-to-Cloudinary upload. **The secret is never returned.** | 🔒 |
| `GET` `POST` | `/api/live/details/:courseId` · `/start` | Live session state; `404` when nothing is live. Polled every 30 s. | 🔒 |

## Chat history — `/api/chat`

```http
GET /api/chat/:courseId/messages?limit=<1-100>&before=<messageId>
→ { messages, hasMore }
```

Requires `isAuth` **and the same enrollment check as `join_room`** (403 otherwise) — the socket and HTTP doors enforce one rule via `courseAccess.js`. Messages return oldest-first; `before` is a cursor — pass the `id` of the oldest message you hold to page backwards.

## Socket.io events

Same origin as `VITE_SERVER_URL`. The client connects with the JWT in `socket.auth.token` (Bearer header and `token` cookie also accepted). **Unauthenticated handshakes are rejected.**

| Event | Direction | Payload | Notes |
| :--- | :--- | :--- | :--- |
| `join_room` | client → server | `roomId` (course id) | Rejected unless the user is an enrolled student or the course educator. Acks `{ ok }`. |
| `room_joined` | server → client | `{ room }` | Sent on successful join. |
| `leave_room` | client → server | `roomId` | Leaves without dropping the connection (course switch); posting afterwards is refused. |
| `send_message` | client → server | `{ room, text }` | Only valid for joined rooms; text capped at 2000 chars. **Persisted before broadcast** — on write failure nothing is broadcast and the sender gets `chat_error`. |
| `receive_message` | server → client | `{ id, room, text, senderId, senderName, senderRole, senderPhotoUrl, createdAt }` | Broadcast to the whole room including the sender. **Identity is server-stamped.** `id` is the MongoDB document id, so a live message and its history copy are identical. |
| `typing` | client → server | `{ room, isTyping }` | Relayed, never stored; ignored for un-joined rooms. |
| `user_typing` | server → client | `{ room, userId, name, isTyping }` | Sent to everyone in the room *except* the sender. |
| `presence_update` | server → client | `{ room, members: [{ _id, name, role, photoUrl }] }` | Emitted on join, `leave_room`, and disconnect. **Deduplicated per user** — two tabs count once. |
| `chat_error` | server → client | `{ message }` | Join failures, over-long messages, failed writes. |

---

[← Back to the README](../README.md)
