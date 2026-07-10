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
  sm: "text-[11px] px-2.5 py-1",
  md: "text-[12px] px-3 py-1.5",
};

const iconSizes = {
  sm: 12,
  md: 13,
};

/** All-purpose button with variant and size props. Pass an `icon` (lucide component) to show it beside the label — defaults to the right, set `iconPosition="left"` to lead with it. Any other native <button> props (onClick, disabled, type, etc.) pass through via ...rest. */
export function Button({ variant = "ghost", size = "md", icon: Icon, iconPosition = "right", className, children, ...rest }) {
  const iconEl = Icon && <Icon size={iconSizes[size]} strokeWidth={2.25} />;
  return (
    <button
      className={cn(
        "font-sans font-semibold rounded-[8px] inline-flex items-center gap-1.5 cursor-pointer transition-all duration-100 disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {iconPosition === "left" && iconEl}
      {children}
      {iconPosition === "right" && iconEl}
    </button>
  );
}
