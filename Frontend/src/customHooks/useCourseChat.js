import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import socket, { connectSocket, releaseSocket } from "../config/socketClient.js";
import axiosClient from "../config/axiosClient.js";

const PAGE_SIZE = 50;

/* How long a "typing" indicator survives without a refresh. The sender re-emits
   every TYPING_PING_MS while it keeps typing, so anything older than this means
   the stop-event was lost (tab closed, network drop) and the row should clear
   itself rather than hang forever. */
const TYPING_TTL_MS = 5000;
const TYPING_PING_MS = 2000;
const TYPING_IDLE_MS = 2500;

/* Chat state for one course room: persisted history over REST, live updates over
   the socket, plus who is present and who is typing.

   Connects on mount, joins the course room once the socket is connected, and
   releases the socket only when the last consumer unmounts. Handlers close over
   courseId/enabled directly — the effect re-subscribes whenever either changes. */
const useCourseChat = (courseId, enabled) => {
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [typers, setTypers] = useState([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  /* One key for "which transcript are we showing" — the room plus whether chat
     is switched on at all. Deriving the reset from a key change during render
     (rather than in an effect) means a course switch never paints the previous
     course's messages, and the history flag starts out true instead of being
     flipped by a second render. */
  const roomKey = `${courseId || ""}:${enabled ? 1 : 0}`;
  const shouldLoad = Boolean(enabled && courseId);
  const [loadingHistory, setLoadingHistory] = useState(shouldLoad);
  const [prevRoomKey, setPrevRoomKey] = useState(roomKey);

  /* Timers and the raw typing map live in refs: they change far more often than
     the render output and must survive re-subscribes without resetting. */
  const typingRef = useRef(new Map());
  const typingSweepRef = useRef(null);
  const lastTypingPingRef = useRef(0);
  const idleTimerRef = useRef(null);

  // A room switch clears the previous course's transcript before the first paint.
  if (roomKey !== prevRoomKey) {
    setPrevRoomKey(roomKey);
    setMessages([]);
    setJoined(false);
    setError(null);
    setMembers([]);
    setTypers([]);
    setHasMore(false);
    // Owned by the fetch effect below, which re-runs for the new room.
    setLoadingHistory(shouldLoad);
    /* The typing ref is cleared in the live-channel effect below, not here —
       touching a ref during render is unsafe under concurrent rendering. */
  }

  /* Messages arrive from two sources that can overlap: a history page fetched
     over REST and live socket echoes. Both carry the same server-issued id, so
     de-duplicating on it makes the merge idempotent regardless of which lands
     first. Order is oldest-first by id, matching the server's cursor. */
  const mergeMessages = useCallback((existing, incoming) => {
    const seen = new Set(existing.map((m) => m.id));
    const fresh = incoming.filter((m) => !seen.has(m.id));
    if (!fresh.length) return existing;
    return [...existing, ...fresh].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
  }, []);

  const publishTypers = useCallback(() => {
    const now = Date.now();
    const live = [];
    for (const [userId, entry] of typingRef.current) {
      if (now - entry.at > TYPING_TTL_MS) {
        typingRef.current.delete(userId);
      } else {
        live.push({ userId, name: entry.name });
      }
    }
    setTypers((prev) => {
      const same =
        prev.length === live.length &&
        prev.every((p, i) => p.userId === live[i].userId);
      return same ? prev : live;
    });
  }, []);

  /* Load the most recent page of persisted history for the room. loadingHistory
     is already true on this render (set at init and on every room switch), so
     the effect only ever has to turn it off. */
  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    axiosClient
      .get(`/api/chat/${courseId}/messages`, { params: { limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setMessages((prev) => mergeMessages(prev, data.messages || []));
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.message || "Could not load earlier messages."
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, shouldLoad, mergeMessages]);

  // Live channel: join the room, then stream messages, presence and typing.
  useEffect(() => {
    if (!enabled || !courseId) return;

    connectSocket();

    /* Drop any indicator carried over from the previous room before this room's
       events start landing — this effect re-runs on every courseId change. */
    typingRef.current.clear();

    /* Identity comes from the server (socket.user), so we filter on the same
       field the server stamps — a locally forged message can't impersonate. */
    const onReceive = (msg) => {
      if (msg.room !== courseId) return;
      setMessages((prev) => mergeMessages(prev, [msg]));
      // Anything they just said settles the question of whether they're typing.
      typingRef.current.delete(msg.senderId);
      publishTypers();
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
    const onPresence = (payload) => {
      if (payload?.room !== courseId) return;
      const list = payload.members || [];
      setMembers(list);
      // Someone who left the room cannot still be typing in it.
      const present = new Set(list.map((m) => m._id));
      for (const userId of typingRef.current.keys()) {
        if (!present.has(userId)) typingRef.current.delete(userId);
      }
      publishTypers();
    };
    const onTyping = ({ room, userId, name, isTyping }) => {
      if (room !== courseId || !userId) return;
      if (isTyping) {
        typingRef.current.set(userId, { name, at: Date.now() });
      } else {
        typingRef.current.delete(userId);
      }
      publishTypers();
    };
    const onConnect = () => {
      setError(null);
      socket.emit("join_room", courseId);
    };
    const onDisconnect = () => {
      setJoined(false);
      setMembers([]);
      typingRef.current.clear();
      publishTypers();
    };

    socket.on("receive_message", onReceive);
    socket.on("room_joined", onJoined);
    socket.on("chat_error", onChatError);
    socket.on("presence_update", onPresence);
    socket.on("user_typing", onTyping);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Already connected before this effect ran (second consumer)?
    if (socket.connected) onConnect();

    // Backstop for a stop-event that never arrives.
    typingSweepRef.current = setInterval(publishTypers, 1000);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("room_joined", onJoined);
      socket.off("chat_error", onChatError);
      socket.off("presence_update", onPresence);
      socket.off("user_typing", onTyping);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);

      clearInterval(typingSweepRef.current);
      clearTimeout(idleTimerRef.current);
      lastTypingPingRef.current = 0;

      /* Tell the room we're gone before dropping the shared socket — on a course
         switch the connection itself may stay up for another consumer. */
      if (socket.connected) {
        socket.emit("typing", { room: courseId, isTyping: false });
        socket.emit("leave_room", courseId);
      }
      releaseSocket();
    };
  }, [courseId, enabled, mergeMessages, publishTypers]);

  const stopTyping = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    lastTypingPingRef.current = 0;
    if (socket.connected) {
      socket.emit("typing", { room: courseId, isTyping: false });
    }
  }, [courseId]);

  /* Called on every keystroke, but only pings the server every TYPING_PING_MS —
     enough to keep the remote TTL alive without a packet per character. */
  const notifyTyping = useCallback(() => {
    if (!joined) return;

    const now = Date.now();
    if (now - lastTypingPingRef.current > TYPING_PING_MS) {
      lastTypingPingRef.current = now;
      socket.emit("typing", { room: courseId, isTyping: true });
    }

    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [courseId, joined, stopTyping]);

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || !joined) return;
      stopTyping();
      socket.emit("send_message", { room: courseId, text: trimmed });
    },
    [courseId, joined, stopTyping]
  );

  // Older page, anchored to the oldest message currently held.
  const loadOlder = useCallback(() => {
    if (!hasMore || loadingOlder || !messages.length) return;

    setLoadingOlder(true);
    axiosClient
      .get(`/api/chat/${courseId}/messages`, {
        params: { limit: PAGE_SIZE, before: messages[0].id },
      })
      .then(({ data }) => {
        setMessages((prev) => mergeMessages(prev, data.messages || []));
        setHasMore(Boolean(data.hasMore));
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || "Could not load earlier messages."
        );
      })
      .finally(() => setLoadingOlder(false));
  }, [courseId, hasMore, loadingOlder, messages, mergeMessages]);

  const typingLabel = useMemo(() => {
    if (!typers.length) return "";
    const [first, second] = typers;
    if (typers.length === 1) return `${first.name} is typing…`;
    if (typers.length === 2) return `${first.name} and ${second.name} are typing…`;
    return `${first.name} and ${typers.length - 1} others are typing…`;
  }, [typers]);

  return {
    messages,
    joined,
    error,
    members,
    typers,
    typingLabel,
    loadingHistory,
    loadingOlder,
    hasMore,
    sendMessage,
    notifyTyping,
    stopTyping,
    loadOlder,
  };
};

export default useCourseChat;
