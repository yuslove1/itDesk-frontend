// ─────────────────────────────────────────────────────────────────────────────
// lib/socket.js — Single shared socket.io connection
//
// WHY A SINGLETON MODULE INSTEAD OF CREATING A SOCKET WHEREVER IT'S NEEDED?
// useCurrentUser() runs on every protected page (it's called from AppShell),
// so if connecting a socket lived inside that hook directly, navigating
// between pages would open a new connection each time. Keeping one `socket`
// variable at module scope means every part of the app that imports this file
// shares the exact same connection — connectSocket()/disconnectSocket() are
// safe to call from multiple places without ever double-connecting.
//
// WHY withCredentials: true?
// Same reason as axios in lib/api.js — the backend's socket.io middleware
// (see itDesk_api/index.js) reads the session from the same httpOnly cookie
// used for regular API calls, via the initial HTTP handshake request that
// socket.io makes before upgrading to a WebSocket. Without withCredentials,
// that handshake request wouldn't carry the cookie at all, and the backend
// would reject the connection as unauthenticated.
//
// WHY autoConnect: false?
// A socket has no business existing before we know someone is logged in —
// connecting is triggered explicitly (see lib/hooks/useCurrentUser.js) once
// GET /auth/me confirms a session exists, and torn down explicitly on logout.
// ─────────────────────────────────────────────────────────────────────────────

import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });

    // Dev-only visibility into connection state — mirrors the request logging
    // in lib/api.js. None of this affects behavior; it's just so a dropped
    // connection or a rejected (unauthenticated) handshake doesn't fail silently.
    if (process.env.NODE_ENV !== "production") {
      socket.on("connect", () => console.log("[socket] connected"));
      socket.on("disconnect", (reason) => console.log("[socket] disconnected:", reason));
      socket.on("connect_error", (err) => console.log("[socket] connection error:", err.message));
    }
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

// Components attach/detach listeners on this shared instance directly, e.g.:
//   const socket = getSocket();
//   socket.on("task:created", handler);
//   return () => socket.off("task:created", handler);   // cleanup on unmount
export { getSocket };
