import { cn } from "@/lib/utils";

// Variant → Tailwind classes
const variants = {
  red:           "bg-uac-red text-white hover:bg-uac-red-dark",
  green:         "bg-uac-green text-white hover:bg-uac-green-dk",
  ghost:         "bg-transparent border border-border text-ink3 hover:border-ink4 hover:text-ink",
  "soft-green":  "bg-uac-green-soft text-uac-green-dk border border-uac-green-mid hover:bg-uac-green-mid/40",
  "soft-red":    "bg-uac-red-soft text-uac-red border border-uac-red-mid",
  "outline-green":"bg-transparent border border-uac-green text-uac-green-dk hover:bg-uac-green-soft",
};

const sizes = {
  sm: "text-[9px] px-2.5 py-1",
  md: "text-[10px] px-3 py-1.5",
};

/** All-purpose button with variant and size props. Any other native <button> props (onClick, disabled, type, etc.) pass through via ...rest. */
export function Button({ variant = "ghost", size = "md", className, children, ...rest }) {
  return (
    <button
      className={cn(
        "font-mono font-semibold uppercase tracking-wide rounded-[6px] inline-flex items-center gap-1.5 cursor-pointer transition-all duration-100 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
