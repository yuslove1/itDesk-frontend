// ─────────────────────────────────────────────────────────────────────────────
// lib/api.js — Central axios instance with request/response interceptors
//
// WHY AXIOS INSTEAD OF FETCH?
// Same reason as before — every API call needs shared behaviour (base URL,
// sending cookies, handling auth failures). axios makes that behaviour a
// first-class concept (interceptors) instead of something we re-implement by
// hand inside one wrapper function.
//
// WHY withCredentials: true?
// Auth is no longer a token we attach ourselves — the backend sets an httpOnly
// session cookie (it_desk_sid) that the browser manages automatically. But the
// frontend and backend live on different domains (Vercel vs Render), and
// browsers don't send cookies cross-origin by default. withCredentials is what
// tells axios "include cookies on this request, and accept Set-Cookie from the
// response" — without it, login would appear to succeed but no session would
// ever actually be stored.
//
// USAGE EXAMPLES (unchanged from the fetch-based version):
//   const { tasks } = await api.get("/tasks");
//   const { task }  = await api.post("/tasks", { title: "Fix printer" });
//   await api.patch("/tasks/abc123", { status: "done" });
//   await api.delete("/tasks/abc123");
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Requests that happen BEFORE a session exists (or that establish one). If one
// of these fails with 401 (e.g. wrong password on login), that's an expected,
// normal outcome — not a sign of an expired session — so the response
// interceptor below must not treat it as "log the user out and redirect".
const AUTH_ENTRY_POINTS = ["/auth/login", "/auth/register", "/auth/verify-otp", "/auth/resend-otp"];

const instance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// There's no per-request token to attach anymore (the cookie handles that
// automatically), so this interceptor's job shrinks down to something purely
// informational: a lightweight dev-only log of outgoing requests. This is a
// realistic use of a request interceptor even without auth in the picture —
// not every interceptor exists to inject a header.
instance.interceptors.request.use((config) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[api] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEntryPoint = AUTH_ENTRY_POINTS.some((path) => error.config?.url?.startsWith(path));

    // A 401 on any already-authenticated request means the session cookie is
    // missing or expired server-side — bounce back to login. We deliberately
    // exclude the auth entry points above, since a 401 *there* just means
    // "wrong password", not "your session expired".
    if (error.response?.status === 401 && !isAuthEntryPoint && typeof window !== "undefined") {
      window.location.href = "/";
    }

    // Normalize the error message so every existing `catch (err) { err.message }`
    // call site across the app keeps working unchanged, showing the server's
    // actual error text instead of axios's generic "Request failed with status code 401".
    if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }

    return Promise.reject(error);
  },
);

// ── Core request function ─────────────────────────────────────────────────────
async function request(method, path, body) {
  const res = await instance.request({ method, url: path, data: body });
  return res.data;
}

// ── HTTP method shortcuts ─────────────────────────────────────────────────────
export const api = {
  get:    (path)       => request("get",    path),
  post:   (path, body) => request("post",   path, body),
  patch:  (path, body) => request("patch",  path, body),
  delete: (path)        => request("delete", path),
};
