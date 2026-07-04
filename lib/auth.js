// ─────────────────────────────────────────────────────────────────────────────
// lib/auth.js — Auth API calls
//
// WHY IS THIS FILE SO MUCH SMALLER THAN BEFORE?
// Under JWT, this file did the actual work of "being logged in" — writing the
// token to localStorage, duplicating it into cookies, reading it back out.
// Under session auth, the browser + backend handle all of that via the
// httpOnly it_desk_sid cookie — client-side JS never sees it and never needs
// to store anything itself. What's left here is just the two auth actions
// that aren't plain CRUD: logging out, and asking "who am I right now?".
// ─────────────────────────────────────────────────────────────────────────────

import { api } from "./api";

// ── Sign out ───────────────────────────────────────────────────────────────────
// Unlike clearing a local token, this is a real request — it destroys the
// session row in the database. There is nothing left afterward for anyone to
// replay, even if they somehow still had the old cookie value.
export async function logout() {
  await api.post("/auth/logout");
}

// ── Who's logged in right now? ────────────────────────────────────────────────
// Always asks the server fresh rather than trusting a local cache — the cache
// could go stale (e.g. a role change) in a way a cookie-only check never would.
// Returns null on any failure (no session, expired session, network error),
// so callers can treat "no user" and "not logged in" as the same thing.
export async function getCurrentUser() {
  try {
    const res = await api.get("/auth/me");
    return res.user;
  } catch {
    return null;
  }
}
