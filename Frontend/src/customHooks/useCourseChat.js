import { useEffect, useState } from "react";
import socket, { connectSocket, releaseSocket } from "../config/socketClient.js";

/* Shared connection lifecycle: connects on mount, joins the course room once
   the socket is connected, and releases the socket only when the last
   consumer unmounts. Handlers close over courseId/enabled directly — the
   effect re-subscribes whenever either changes. */
const useCourseChat = (courseId, enabled) => {
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [prevCourseId, setPrevCourseId] = useState(courseId);

  /* Messages are not persisted, so a room switch starts from an empty log
     rather than showing the previous course's transcript. */
  if (courseId !== prevCourseId) {
    setPrevCourseId(courseId);
    setMessages([]);
    setJoined(false);
    setError(null);
  }

  useEffect(() => {
    if (!enabled) return;

    connectSocket();

    /* Identity comes from the server (socket.user), so we filter on the same
       field the server stamps — a locally forged message can't impersonate. */
    const onReceive = (msg) => {
      if (msg.room !== courseId) return;
      setMessages((prev) => [...prev, msg]);
    };
    const onJoined = (payload) => {
      if (payload?.room !== courseId) return;
      setJoined(true);
      setError(null);
    };
    const onChatError = ({ message }) => {
      setError(message || "Chat error");
      setJoined(false);
    };
    const onConnect = () => {
      setError(null);
      socket.emit("join_room", courseId);
    };
    const onDisconnect = () => {
      setJoined(false);
    };

    socket.on("receive_message", onReceive);
    socket.on("room_joined", onJoined);
    socket.on("chat_error", onChatError);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Already connected before this effect ran (second consumer)?
    if (socket.connected) onConnect();

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("room_joined", onJoined);
      socket.off("chat_error", onChatError);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      releaseSocket();
    };
  }, [courseId, enabled]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || !joined) return;
    socket.emit("send_message", { room: courseId, text: trimmed });
  };

  return { messages, joined, error, sendMessage };
};

export default useCourseChat;
