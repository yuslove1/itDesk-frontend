// Simple cn() utility — merges class strings (no clsx dependency needed)
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Buckets a list of items into daily counts for the last `days` days
// (oldest first), keyed by the date each item's `getDate(item)` falls on.
// Used to derive real stat-tile sparklines from already-fetched data —
// no fabricated trend, no extra API calls.
export function bucketByDay(items, getDate, days = 7) {
  const counts = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = new Date(raw);
    d.setHours(0, 0, 0, 0);
    const dayIndex = days - 1 - Math.round((today - d) / 86400000);
    if (dayIndex >= 0 && dayIndex < days) counts[dayIndex] += 1;
  }

  return counts;
}
