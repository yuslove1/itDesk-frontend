// ─────────────────────────────────────────────────────────────────────────────
// lib/validators.js — Small, hand-written validation + sanitization helpers
//
// WHY NOT A VALIDATION LIBRARY?
// Every form in this app checks the same handful of things (a field isn't
// blank, an email looks like an email, a password is long enough). A schema
// library is genuinely useful once you have dozens of complex, nested shapes
// to validate — this app doesn't. A handful of small functions is easier to
// read, has zero new dependencies, and is just as correct for what's actually
// needed here.
//
// WHY BOTHER WITH CLIENT-SIDE VALIDATION AT ALL, IF THE SERVER VALIDATES TOO?
// It's a UX nicety, not a security boundary — the server (see itDesk_api's
// route handlers) is the real gate and re-checks everything regardless,
// because a client can always be bypassed (disabled JS, a direct API call,
// a modified request). Client-side validation exists purely so a user gets
// instant feedback instead of waiting on a round-trip to find out they forgot
// a field.
// ─────────────────────────────────────────────────────────────────────────────

// ── isRequired ────────────────────────────────────────────────────────────────
// True if the value is a non-empty string once surrounding whitespace is
// ignored — "   " should not count as a filled-in field.
export function isRequired(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// ── isValidEmail ───────────────────────────────────────────────────────────────
// Deliberately simple: "something@something.something", no whitespace.
// A fully RFC-5322-correct email regex is notoriously huge and still doesn't
// guarantee the address actually exists — the OTP step is what really proves
// someone owns the address. This just catches obvious typos before submit.
export function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// ── minLength ──────────────────────────────────────────────────────────────────
export function minLength(value, n) {
  return typeof value === "string" && value.trim().length >= n;
}

// ── sanitizeInput ──────────────────────────────────────────────────────────────
// Trims surrounding whitespace before a value is sent to the API. This is a
// UX/data-hygiene helper, not an XSS defense — React already escapes every
// value it renders into JSX by default (that's why dangerouslySetInnerHTML
// exists as an explicit, separate opt-out; this app doesn't use it anywhere).
// The real defense against malicious input is the server treating all input
// as untrusted regardless of what the client sent.
export function sanitizeInput(value) {
  return typeof value === "string" ? value.trim() : value;
}
