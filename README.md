# IT Desk — Frontend

An internal operations tool for the IT department at a dairy processing plant: task tracking, a daily activity log, shift handover notes, an asset register, and shareable status reports — built for a small in-house team (IT staff + a manager).

This repository is the **frontend** (React via Next.js). The backend lives in a separate repository — see [Repository Map](#repository-map) below.

## Table of contents
1. [Architecture & Domain Overview](#architecture--domain-overview)
2. [Repository Map](#repository-map)
3. [Original Functionality](#original-functionality)
4. [New Functionality](#new-functionality)
5. [Live Application URL](#live-application-url)
6. [Testing Guide](#testing-guide)

## Architecture & Domain Overview

**Domain**: IT staff at the plant log daily activity, track hardware/software tasks on a kanban-style board, leave handover notes for whoever's on the next shift, keep a register of physical assets (laptops, printers, UPS units, etc.), and can generate a shareable snapshot report (e.g. to send a manager a WhatsApp update). A manager role gets read-mostly dashboards plus the ability to create and assign tasks.

**System shape**: a React (Next.js App Router) frontend talking to a separate Express + PostgreSQL (via Prisma) API over plain REST, with two additions on top of REST:

- **Session-based authentication** — the API issues an `httpOnly` session cookie on login (backed by a `Session` table in Postgres, via `express-session` + `@quixo3/prisma-session-store`). The frontend never touches a token directly; the browser sends the cookie automatically on every request (`withCredentials: true`).
- **Realtime updates** — a `socket.io` connection (authenticated via the same session cookie) pushes `task:*` / `log:*` events so the board and daily log update live across open sessions, without polling.

Frontend and backend are deployed as two separate services on two different domains (frontend on Vercel, API on Render), which is why the session cookie is `SameSite=None; Secure` in production — a cross-site cookie is the whole reason that setting exists.

Auth flow: register → 6-digit email OTP (sent via Gmail, see backend) → verify → session established → protected routes.

## Repository Map

```
app/                     Next.js App Router — one folder per route
  page.jsx               Login
  signup/, verify-otp/   Registration + email OTP verification
  dashboard/, manager/   Role-specific landing dashboards
  tasks/                 Kanban task board
  log/                   Daily activity log
  handover/              Shift handover notes
  assets/                Asset register
  report/                Generate + view shareable snapshot reports
                         (report/[token]/ is the PUBLIC view — no login required)

components/
  ui/                    Presentational building blocks (TaskCard, LogEntryCard,
                         StatCard, Avatar, Badge, Button, etc.)
  layout/                AppShell (page chrome), Sidebar (nav + session/profile),
                         Topbar

lib/
  api.js                 Shared axios instance — withCredentials, request/response
                         interceptors (see New Functionality)
  auth.js                Auth API calls (logout, getCurrentUser) — no local session
                         storage; the httpOnly cookie is the session
  hooks/useCurrentUser.js  Fetches the logged-in user; redirects to login if none
                         (this is the route guard now — see New Functionality)
  data/                  Static mock data (pre-dates the live API; a few pages
                         still reference it for local development)
  utils.js               Small shared helpers (cn() class merging)

types/index.js            JSDoc type definitions for the app's core domain shapes
                         (Task, LogEntry, Asset, User, etc.) — documentation only,
                         not enforced at build time (this is a plain JS project)
```

**Backend** (Express + Prisma + PostgreSQL): [github.com/yuslove1/Dairies_IT_Desk](https://github.com/yuslove1/Dairies_IT_Desk), `itDesk_api/` directory, `lancer-assessment` branch. Routes: `auth`, `tasks`, `logs`, `handover`, `assets`, `reports`, `users`.

## Original Functionality

Everything below existed before this assessment (see commit history from 2026-04-10 onward):

- Email/password registration with 6-digit OTP verification
- Role-based views: **staff** (full CRUD on their own work) vs **manager** (read + create/assign tasks)
- Kanban task board (To Do / In Progress / Done) with priority and category tagging
- Daily activity log with per-entry categories
- Shift handover notes (active vs archived)
- Asset register with filtering by type/status
- Shareable, expiring (24h) snapshot report with a public link (no login required to view)

## New Functionality

Added/changed for this assessment, matching the concepts covered in the technical interview:

- **Plain React + JSX** — the frontend was originally Next.js + TypeScript; it's been converted to plain JavaScript/JSX (`.jsx`/`.js`, no TypeScript tooling), per the assessment's stated stack requirement. Domain types are now documented via JSDoc instead of enforced by the compiler.
- **Session authentication** (replacing JWT-in-`localStorage`) — the API now issues a server-side session (Postgres-backed, `httpOnly` cookie) instead of a JWT the client stored itself. This is a real security upgrade, not just a swap: logout now immediately and permanently invalidates the session server-side, whereas a JWT stays valid until it expires no matter what. See `lib/auth.js` and `lib/hooks/useCurrentUser.js`.
- **Axios + interceptors** (replacing a hand-rolled `fetch` wrapper) — `lib/api.js` is now a shared axios instance with a response interceptor that normalizes server error messages and redirects to login on an expired session, and a request interceptor for lightweight dev-mode request logging.
- **Route protection moved client-side** — worth calling out explicitly: switching to a cross-domain `httpOnly` session cookie means the previous server-side route-protection middleware (`proxy.js`, Next.js's edge middleware) can no longer read it at all — that cookie belongs to the API's domain, not the frontend's. `proxy.js` has been removed; the guard now lives in `useCurrentUser` (calls `GET /auth/me`, redirects if unauthenticated). The real security boundary was always the API's `protect()` middleware regardless — this change just stopped pretending the frontend had a second one.
- **Input validation & sanitization** — hand-written (`lib/validators.js`: `isRequired`, `isValidEmail`, `minLength`, `sanitizeInput`), deliberately not a schema library — every form in this app validates the same handful of simple things, so a library would be more machinery than the problem needs. Wired into every form that writes data: login, signup, task create/edit, log entries, handover notes, and the asset register. This is a UX layer only — the backend re-validates everything regardless, since a client can always be bypassed.
- **Live task/log board via WebSockets (socket.io)** — backend emits `task:created` / `task:updated` / `task:deleted` / `log:created` / `log:updated` / `log:deleted`; *frontend client wiring in progress.*

## Live Application URL

*Not yet deployed — to be added once the frontend (Vercel) and backend (Render) are both live and cross-origin cookies are confirmed working in production.*

## Testing Guide

**Prerequisites**: Node 20+, a PostgreSQL database (see backend README for setup + `npx prisma migrate dev`).

**1. Run the backend** (see backend repo for full instructions):
```bash
cd itDesk_api
npm install
npm run dev   # http://localhost:4000
```

**2. Run this frontend**:
```bash
npm install
npm run dev   # http://localhost:3000
```
Set `NEXT_PUBLIC_API_URL` in `.env.local` if the API isn't on `http://localhost:4000`.

**3. Demo accounts** — seeded specifically for reviewing this submission (already verified, skip the OTP step):
| Email | Role | Password |
|---|---|---|
| `demo.staff@itdesk-review.com` | staff | `DemoReview123!` |
| `demo.manager@itdesk-review.com` | manager | `DemoReview123!` |

Or register a fresh account through the UI to exercise the full OTP flow (the backend prints the OTP to its console in development, so you don't need real email delivery to test locally).

**4. What to click through**:
- Register → verify OTP → land on `/dashboard` (staff) — confirm a session cookie (`it_desk_sid`) is set, not a token in `localStorage`.
- Log out from the sidebar → confirm you're redirected to `/` and can no longer reach `/dashboard` directly (should bounce back to login).
- Log in as **demo.manager** → land on `/manager` → create a task and assign it to the staff account.
- Log in as **demo.staff** → see the assigned task on `/tasks`, move it between columns.
- Add a log entry, a handover note, and an asset; confirm they all show up immediately without a page refresh (optimistic UI on create).
- `/report` → generate a snapshot → open the returned link in an incognito window (no login) → confirm it renders and expires after 24h.
