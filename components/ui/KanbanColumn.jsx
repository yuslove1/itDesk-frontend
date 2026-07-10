import { TaskCard } from "@/components/ui/TaskCard";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const dotStyles = {
  gray:  "bg-ink5",
  amber: "bg-amber",
  green: "bg-uac-green",
};

/** Single Kanban column with a header dot + task count. Pass `onAddCard` to show a Trello-style "+ Add a card" affordance at the bottom. */
export function KanbanColumn({ title, tasks, dotColor, onStatusChange, onDelete, onEdit, onAddCard }) {
  return (
    <div className="bg-surf border border-border rounded-[10px] overflow-hidden flex flex-col">
      {/* Column header */}
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-border shrink-0">
        <div className={cn("w-2 h-2 rounded-full", dotStyles[dotColor])} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">{title}</span>
        <span className="ml-auto text-[10px] text-ink5">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="p-2 flex flex-col gap-1.5 min-h-24">
        {tasks.length === 0 ? (
          <p className="text-[10px] text-ink6 text-center py-4">No cards yet</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              muted={task.status === "done"}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))
        )}
      </div>

      {onAddCard && (
        <button
          onClick={onAddCard}
          className="flex items-center gap-1.5 text-[11px] font-medium text-ink4 hover:text-uac-green-dk hover:bg-uac-green-soft px-3 py-2 border-t border-border transition-colors"
        >
          <Plus size={13} strokeWidth={2.25} /> Add a card
        </button>
      )}
    </div>
  );
}
