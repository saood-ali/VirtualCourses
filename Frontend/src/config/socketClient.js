import { io } from "socket.io-client";

const serverUrl = import.meta.env.VITE_SERVER_URL;

/* Single shared connection for the whole app. `auth` is a callback so the token
   is re-read on every reconnect attempt rather than frozen at import time —
   same source as the axiosClient request interceptor. The cookie fallback is
   covered by withCredentials for cookie-only (Google OAuth) sessions. */
const socket = io(serverUrl, {
  autoConnect: false,
  withCredentials: true,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});

/* Ref-counted so two consumers can share the socket without one's unmount
   tearing down the other's connection. */
let consumers = 0;

export const connectSocket = () => {
  consumers += 1;
  if (!socket.connected) socket.connect();
};

export const releaseSocket = () => {
  consumers = Math.max(0, consumers - 1);
  if (consumers === 0) socket.disconnect();
};

export default socket;
