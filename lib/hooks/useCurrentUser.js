// lib/hooks/useCurrentUser.js
//
// Fetches the logged-in user fresh from the server (GET /auth/me) and maps it
// to the User shape AppShell expects.
//
// WHY THE REDIRECT LIVES HERE:
// Now that proxy.js can no longer see the (httpOnly, cross-domain) session
// cookie, there's no server-side middleware left to gate protected pages —
// see proxy.js's removal for the full reasoning. Every protected page already
// renders through AppShell, and AppShell already calls this hook, so putting
// the "not logged in? bounce to login" check right here means every protected
// page gets the guard for free, with no per-page code needed.
// The REAL security boundary was always the API's protect() middleware
// anyway — this redirect is a UX nicety, not the thing keeping data safe.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((stored) => {
      if (!stored) {
        router.replace("/");
        return;
      }

      // Every protected page renders through this hook, but connectSocket()
      // is a no-op once already connected — so this is safe to run on every
      // page navigation without opening duplicate connections.
      connectSocket();

      // Compute initials from the name (first letter of first two words)
      const parts    = stored.name.trim().split(" ");
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : stored.name.slice(0, 2).toUpperCase();

      setUser({
        id:         stored.id,
        name:       stored.name,
        initials,
        email:      stored.email,
        role:       stored.role,
        department: "IT Support · Dairies Plant",
      });
    });
  }, [router]);

  return user;
}
