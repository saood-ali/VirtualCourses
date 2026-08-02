import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import User from "../models/userModel.js";
import Course from "../models/courseModel.js";

const MAX_MESSAGE_LENGTH = 2000;

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

/* A socket may only join a course room it has a seat in: enrolled student or
   the educator who owns the course. */
const canAccessCourse = async (courseId, userId) => {
  const course = await Course.findById(courseId)
    .select("creator enrolledStudents")
    .lean();
  if (!course) return false;

  if (course.creator?.toString() === userId) return true;
  return (course.enrolledStudents || []).some((id) => id.toString() === userId);
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

      // Identity is resolved once here, then trusted for the socket's lifetime.
      socket.user = {
        _id: user._id.toString(),
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl || "",
      };
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
      } catch (error) {
        console.error("join_room failed:", error);
        socket.emit("chat_error", { message: "Could not join the discussion." });
        if (typeof ack === "function") ack({ ok: false });
      }
    });

    socket.on("send_message", (data) => {
      const room = data?.room;
      const text = typeof data?.text === "string" ? data.text.trim() : "";

      // Only rooms this socket actually joined — join_room did the authorization.
      if (!room || !socket.rooms.has(room)) {
        socket.emit("chat_error", { message: "You are not in this room." });
        return;
      }
      if (!text) return;
      if (text.length > MAX_MESSAGE_LENGTH) {
        socket.emit("chat_error", { message: "Message is too long." });
        return;
      }

      /* Sender and timestamp are stamped here, never taken from the client, so
         a message cannot claim to be from someone else. Echoed to the whole
         room including the sender, so every client renders the same list. */
      io.to(room).emit("receive_message", {
        id: randomUUID(),
        room,
        text,
        senderId: socket.user._id,
        senderName: socket.user.name,
        senderRole: socket.user.role,
        senderPhotoUrl: socket.user.photoUrl,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected", socket.id);
    });
  });
};
