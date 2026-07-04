// ─────────────────────────────────────────────────────────────────────────────
// lib/auth.js — Client-side auth helpers
//
// WHY TWO STORAGE MECHANISMS?
// - localStorage  → stores the JWT for API calls (readable only in the browser)
// - Cookie        → stores a flag the server-side proxy.js can read
//                   (proxy runs before the page renders so it can't see localStorage)
//
// This is the standard pattern for JWT + Next.js App Router:
// cookies = route protection, localStorage = API authentication header
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "it_desk_token";
const USER_KEY  = "it_desk_user";

// StoredUser shape: { id: string, name: string, email: string, role: UserRole }

// ── Save session after login ──────────────────────────────────────────────────
export function saveSession(token, user) {
  if (typeof window === "undefined") return;

  // 1. Store the full JWT in localStorage — used by lib/api.js for Authorization header
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // 2. Set a short-lived cookie so proxy.js (server-side) can verify the user is logged in.
  //    We store the role too so the proxy can enforce role-based access without decoding JWT.
  //    7 days expiry matches JWT_EXPIRES_IN.
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `it_desk_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
  document.cookie = `it_desk_role=${user.role}; path=/; expires=${expires}; SameSite=Lax`;
}

// ── Read token (used by lib/api.js) ──────────────────────────────────────────
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ── Read the stored user object ───────────────────────────────────────────────
export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ── Clear session on sign out ─────────────────────────────────────────────────
export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Expire the cookies immediately
  document.cookie = "it_desk_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "it_desk_role=;  path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

// ── Check if user is logged in ────────────────────────────────────────────────
export function isLoggedIn() {
  return !!getToken();
}
