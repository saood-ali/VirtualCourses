import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { io as ioClient } from "socket.io-client";
import chatRouter from "../../routes/chatRoute.js";
import { setupSocket } from "../../config/socketHandler.js";

/* The chat surface only, mounted the same way index.js mounts it. Building the
   app here instead of importing index.js keeps the test off the real database
   and off the real port. */
export const startServer = async () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/chat", chatRouter);

  const httpServer = createServer(app);
  const io = new Server(httpServer);
  setupSocket(io);

  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const { port } = httpServer.address();

  return {
    port,
    baseUrl: `http://127.0.0.1:${port}`,
    stop: async () => {
      await io.close();
      await new Promise((resolve) => httpServer.close(resolve));
    },
  };
};

export const makeToken = (userId) =>
  jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

/* Resolves once the socket is connected, rejects if the handshake is refused —
   so an auth test can await the failure instead of racing a timeout. */
export const connectClient = (port, token) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(`http://127.0.0.1:${port}`, {
      auth: token ? { token } : {},
      transports: ["websocket"],
      reconnection: false,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => {
      socket.close();
      reject(err);
    });
  });

export const waitFor = (socket, event, { timeout = 4000, filter } = {}) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`timed out waiting for "${event}"`));
    }, timeout);

    const handler = (payload) => {
      if (filter && !filter(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });

/* Asserts an event does NOT arrive. Needs a real settle window — there is no
   positive signal to wait on. */
export const expectSilence = async (socket, event, ms = 600) => {
  let seen = null;
  const handler = (payload) => {
    seen = payload;
  };
  socket.on(event, handler);
  await new Promise((r) => setTimeout(r, ms));
  socket.off(event, handler);
  return seen;
};

export const joinRoom = (socket, room) =>
  new Promise((resolve) => socket.emit("join_room", room, resolve));

export const getHistory = async (baseUrl, courseId, token, query = {}) => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(
    `${baseUrl}/api/chat/${courseId}/messages${qs ? `?${qs}` : ""}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  return { status: res.status, body: await res.json().catch(() => null) };
};
