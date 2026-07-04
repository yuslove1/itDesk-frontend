import { cn } from "@/lib/utils";

// Avatar colour by role
const roleColor = {
  staff:   "bg-uac-green",
  manager: "bg-purple",
  admin:   "bg-uac-red",
};

const sizeClass = {
  sm: "w-4 h-4 text-[7px]",
  md: "w-7 h-7 text-[10px]",
};

/** Circular avatar showing user initials, coloured by role. */
export function Avatar({ initials, role, size = "md", className }) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-mono font-bold text-white shrink-0",
        roleColor[role],
        sizeClass[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
