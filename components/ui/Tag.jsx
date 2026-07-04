import { cn } from "@/lib/utils";

// Category → style
const styles = {
  hardware: "bg-amber-soft text-amber",
  network:  "bg-blue-soft text-blue",
  software: "bg-purple-soft text-purple",
  urgent:   "bg-uac-red-soft text-uac-red",
};

/** Small square category tag (hardware / network / software / urgent). */
export function Tag({ category, className }) {
  return (
    <span
      className={cn(
        "font-mono text-[9px] font-medium px-1.5 py-0.5 rounded tracking-wide",
        styles[category],
        className,
      )}
    >
      {category}
    </span>
  );
}
