// Simple cn() utility — merges class strings (no clsx dependency needed)
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
