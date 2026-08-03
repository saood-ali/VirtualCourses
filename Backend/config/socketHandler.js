import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import ChatMessage, { MAX_MESSAGE_LENGTH } from "../models/chatMessageModel.js";
import { canAccessCourse } from "../utils/courseAccess.js";

/* Pull the JWT off the handshake: explicit auth payload, Authorization header,
   or the httpOnly cookie — the same three places isAuth looks. */
const extractToken = (handshake) => {
  if (handshake.auth?.token) return handshake.auth.token;

  const authHeader = handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = handshake.headers?.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));
    if (match) return decodeURIComponent(match.slice("token=".length));
  }

  return null;
};

/* Who is currently in a room, one entry per person rather than per socket — the
   same user with two tabs open should read as one participant.

   `excludeSocketId` covers the `disconnecting` event, where the leaving socket
   is still a member of the room at the moment we recompute the list. */
const buildPresence = async (io, room, excludeSocketId = null) => {
  const sockets = await io.in(room).fetchSockets();
  const byUser = new Map();

  for (const s of sockets) {
    if (s.id === excludeSocketId) continue;
    // fetchSockets returns RemoteSockets: only `data` survives, not ad-hoc props.
    const user = s.data?.user;
    if (!user || byUser.has(user._id)) continue;
    byUser.set(user._id, user);
  }

  return [...byUser.values()];
};

const emitPresence = async (io, room, excludeSocketId = null) => {
  try {
    const members = await buildPresence(io, room, excludeSocketId);
    io.to(room).emit("presence_update", { room, members });
  } catch (error) {
    console.error(`presence_update failed for room ${room}:`, error);
  }
};

export const setupSocket = (io) => {
  /* Handshake auth — an unauthenticated socket never reaches the room handlers. */
  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket.handshake);
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId =
        decoded.userId || decoded.id || decoded.userID || decoded._id;
      if (!userId) return next(new Error("Invalid token payload"));

      const user = await User.findById(userId).select("name role photoUrl").lean();
      if (!user) return next(new Error("User not found"));

      /* Identity is resolved once here, then trusted for the socket's lifetime.
         It lives on `socket.data` so the presence builder can read it back off a
         RemoteSocket; `socket.user` is an alias onto the same object. */
      socket.data.user = {
        _id: user._id.toString(),
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl || "",
      };
      socket.user = socket.data.user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id} (${socket.user.name})`);

    // JOIN ROOM: Students join a specific course's chat room
    socket.on("join_room", async (roomId, ack) => {
      if (!mongoose.isValidObjectId(roomId)) {
        socket.emit("chat_error", { message: "Invalid course room." });
        if (typeof ack === "function") ack({ ok: false });
        return;
      }

      try {
        const allowed = await canAccessCourse(roomId, socket.user._id);
        if (!allowed) {
          socket.emit("chat_error", {
            message: "Enroll in this course to join the discussion.",
          });
          if (typeof ack === "function") ack({ ok: false });
          return;
        }

        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        socket.emit("room_joined", { room: roomId });
        if (typeof ack === "function") ack({ ok: true });

        // Everyone in the room, the new arrival included, gets the fresh list.
        await emitPresence(io, roomId);
      } catch (error) {
        console.error("join_room failed:", error);
        socket.emit("chat_error", { message: "Could not join the discussion." });
        if (typeof ack === "function") ack({ ok: false });
      }
    });

    /* Leaving is explicit when a user navigates between courses; `disconnecting`
       covers the tab-close case. */
    socket.on("leave_room", async (roomId) => {
      if (typeof roomId !== "string" || !socket.rooms.has(roomId)) return;
      socket.leave(roomId);
      socket.to(roomId).emit("user_typing", {
        room: roomId,
        userId: socket.user._id,
        name: socket.user.name,
        isTyping: false,
      });
      await emitPresence(io, roomId);
    });

    socket.on("send_message", async (data, ack) => {
      const room = data?.room;
      const text = typeof data?.text === "string" ? data.text.trim() : "";

      // Only rooms this socket actually joined — join_room did the authorization.
      if (!room || !socket.rooms.has(room)) {
        socket.emit("chat_error", { message: "You are not in this room." });
        if (typeof ack === "function") ack({ ok: false });
        return;
      }
      if (!text) {
        if (typeof ack === "function") ack({ ok: false });
        return;
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        socket.emit("chat_error", { message: "Message is too long." });
        if (typeof ack === "function") ack({ ok: false });
        return;
      }

      try {
        /* Persist first, then broadcast. The stored document is the source of
           truth for both its id and its timestamp, so the message a late joiner
           loads from history is byte-for-byte the one live clients received. */
        const saved = await ChatMessage.create({
          course: room,
          sender: socket.user._id,
          text,
        });

        /* Sender identity comes from the authenticated socket, never from the
           client, so a message cannot claim to be from someone else. Echoed to
           the whole room including the sender, so every client renders the same
           list. Shape matches the history endpoint's serializeMessage. */
        const payload = {
          id: saved._id.toString(),
          room,
          text: saved.text,
          senderId: socket.user._id,
          senderName: socket.user.name,
          senderRole: socket.user.role,
          senderPhotoUrl: socket.user.photoUrl,
          createdAt: saved.createdAt.toISOString(),
        };

        io.to(room).emit("receive_message", payload);
        if (typeof ack === "function") ack({ ok: true, message: payload });
      } catch (error) {
        console.error("send_message failed to persist:", error);
        /* Nothing is broadcast on a write failure — a message everyone sees but
           no one can reload is worse than one that visibly failed to send. */
        socket.emit("chat_error", {
          message: "Message could not be sent. Please try again.",
        });
        if (typeof ack === "function") ack({ ok: false });
      }
    });

    /* Typing is relayed, never stored, and never echoed to the sender. Clients
       expire a stale indicator on their own timer, so a dropped stop-event can
       not leave someone permanently "typing…". */
    socket.on("typing", (data) => {
      const room = data?.room;
      if (!room || !socket.rooms.has(room)) return;

      socket.to(room).emit("user_typing", {
        room,
        userId: socket.user._id,
        name: socket.user.name,
        isTyping: Boolean(data?.isTyping),
      });
    });

    /* Fires while room membership is still intact, unlike `disconnect`. */
    socket.on("disconnecting", async () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      await Promise.all(rooms.map((room) => emitPresence(io, room, socket.id)));
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected", socket.id);
    });
  });
};
