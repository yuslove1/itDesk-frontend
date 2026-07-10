import { cn } from "@/lib/utils";

const styles = {
  amber: "bg-amber-soft text-amber border border-[#f5d08a]",
  green: "bg-uac-green-soft text-uac-green-dk border border-uac-green-mid",
  red:   "bg-uac-red-soft text-uac-red border border-uac-red-mid",
};

/** Inline alert banner (amber / green / red). Pass a lucide `icon` component to lead with it. */
export function Alert({ variant, icon: Icon, children, className }) {
  return (
    <div className={cn("rounded-[6px] px-3 py-2.5 text-[12px] flex items-center gap-2 mb-3", styles[variant], className)}>
      {Icon && <Icon size={14} strokeWidth={2.25} className="shrink-0" />}
      {children}
    </div>
  );
}
