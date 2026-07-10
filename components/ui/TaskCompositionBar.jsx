import { cn } from "@/lib/utils";

// Part-to-whole: todo/wip/done are mutually exclusive states that sum to the
// full task count, so this reads as one stacked bar rather than 3 separate
// meters (each of which would imply its own independent scale).
const SEGMENTS = [
  { key: "todo", label: "Open",        fill: "bg-uac-red",   dot: "bg-uac-red"   },
  { key: "wip",  label: "In progress", fill: "bg-amber",     dot: "bg-amber"     },
  { key: "done", label: "Done",        fill: "bg-uac-green", dot: "bg-uac-green" },
];

/** Horizontal stacked bar showing the todo/wip/done split of the current task count. */
export function TaskCompositionBar({ todo, wip, done }) {
  const counts = { todo, wip, done };
  const total = todo + wip + done;
  const visible = SEGMENTS.filter((s) => counts[s.key] > 0);

  return (
    <div className="bg-surf border border-border rounded-[10px] px-4 py-3.5 mb-5 animate-fade-up">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold text-ink">Task composition</span>
        <span className="text-[10px] text-ink5">{total} task{total !== 1 ? "s" : ""} total</span>
      </div>

      {total === 0 ? (
        <div className="h-2 rounded-full bg-border" />
      ) : (
        <div className="flex h-2 rounded-full overflow-hidden gap-[2px]">
          {visible.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                s.fill,
                i === 0 && "rounded-l-full",
                i === visible.length - 1 && "rounded-r-full",
              )}
              style={{ flex: `${counts[s.key]} 0 0%` }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap mt-2.5">
        {SEGMENTS.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[10px] text-ink4">
            <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
            {s.label} <span className="text-ink">{counts[s.key]}</span>
            {total > 0 && <span>· {Math.round((counts[s.key] / total) * 100)}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
