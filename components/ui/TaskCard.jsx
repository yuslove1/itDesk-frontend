"use client";

import { Pill } from "./Pill";
import { Tag } from "./Tag";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Flag, ChevronDown, Pencil, Trash2, Play, Check, RotateCcw } from "lucide-react";

const priorityStripe = {
  high: "border-l-uac-red",
  med:  "border-l-amber",
  low:  "border-l-uac-green",
};

const priorityColor = {
  high: "text-uac-red",
  med:  "text-amber",
  low:  "text-uac-green",
};

const priorityLabel = {
  high: "High",
  med:  "Medium",
  low:  "Low",
};

const STATUS_ACTIONS = {
  todo: [{ label: "Start",   icon: Play,      to: "wip",  style: "bg-amber-soft text-amber border-amber/30 hover:bg-amber/20" }],
  wip:  [
    { label: "Done",   icon: Check,     to: "done", style: "bg-uac-green-soft text-uac-green-dk border-uac-green/30 hover:bg-uac-green-mid/30" },
    { label: "Reopen", icon: RotateCcw, to: "todo", style: "bg-paper text-ink4 border-border hover:border-ink4 hover:text-ink" },
  ],
  done: [{ label: "Reopen", icon: RotateCcw, to: "wip", style: "bg-paper text-ink4 border-border hover:border-ink4 hover:text-ink" }],
};

export function TaskCard({ task, muted, className, onStatusChange, onDelete, onEdit }) {
  const [moving,     setMoving]     = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const actions = STATUS_ACTIONS[task.status] ?? [];

  async function handleMove(newStatus) {
    if (moving || !onStatusChange) return;
    setMoving(true);
    await onStatusChange(task.id, newStatus);
    setMoving(false);
  }

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    setConfirmDel(false);
  }

  return (
    <div
      className={cn(
        "group bg-surf border border-border rounded-[6px] px-2.5 pt-2.5 pb-2",
        "border-l-[3px] pl-3.5 transition-all duration-150",
        "hover:border-uac-green hover:shadow-[0_2px_8px_rgba(0,121,58,0.10)]",
        priorityStripe[task.priority],
        muted && "opacity-60",
        className,
      )}
    >
      {/* Title row */}
      <p className="text-[11px] font-semibold text-ink leading-snug mb-1.5">
        {task.title}
      </p>

      {/* Tags row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Flag size={11} strokeWidth={2.5} className={cn("shrink-0", priorityColor[task.priority])} fill="currentColor" />
        <Tag category={task.category} />
        <Pill status={task.status} />
        <span className="text-[10px] text-ink5 ml-auto">{task.createdAt}</span>
      </div>

      {/* Assignee */}
      {(task.assignedTo || task.isManagerAssigned) && (
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-ink4">
          <Avatar
            initials={task.isManagerAssigned ? (task.assignedBy?.initials ?? "LM") : task.assignedTo.initials}
            role={task.isManagerAssigned ? "manager" : "staff"}
            size="sm"
          />
          {task.isManagerAssigned ? (
            <span className="text-purple">assigned by manager</span>
          ) : (
            <span>Assigned to you</span>
          )}
          {task.priority === "high" && !task.isManagerAssigned && (
            <span className="ml-auto text-uac-red font-semibold">urgent</span>
          )}
        </div>
      )}

      {/* ── Toggle details button ── */}
      <button
        onClick={() => { setExpanded((v) => !v); setConfirmDel(false); }}
        className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-uac-green hover:text-uac-green-dk transition-colors"
      >
        <ChevronDown size={12} strokeWidth={2.5} className={cn("transition-transform duration-150", expanded && "rotate-180")} />
        {expanded ? "Close details" : "View details"}
      </button>

      {/* ── Expanded details section ── */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border space-y-1.5">
          {task.description ? (
            <p className="text-[10px] text-ink3 leading-relaxed">{task.description}</p>
          ) : (
            <p className="text-[10px] text-ink6 italic">No description provided.</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="text-[10px] text-ink5">Priority: <span className="text-ink3">{priorityLabel[task.priority]}</span></span>
            <span className="text-[10px] text-ink5">Category: <span className="text-ink3 capitalize">{task.category}</span></span>
            <span className="text-[10px] text-ink5">Status: <span className="text-ink3 capitalize">{task.status}</span></span>
          </div>
        </div>
      )}


      {/* ── Edit + Delete — visible on hover for admin/manager ── */}
      {(onEdit || onDelete) && (
        <div className={cn(
          "flex gap-1.5 mt-2 transition-all duration-150",
          confirmDel ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}>
          {onEdit && (
            <button
              onClick={() => { setConfirmDel(false); onEdit(task); }}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border border-border text-ink4 hover:text-ink hover:border-ink4 transition-colors"
            >
              <Pencil size={11} strokeWidth={2.25} /> Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors",
                confirmDel
                  ? "border-uac-red bg-uac-red text-white hover:bg-uac-red-dark"
                  : "border-border text-ink5 hover:border-uac-red hover:text-uac-red",
                deleting && "opacity-50 cursor-wait",
              )}
            >
              {deleting ? "Deleting…" : confirmDel ? "Confirm delete?" : (<><Trash2 size={11} strokeWidth={2.25} /> Delete</>)}
            </button>
          )}
          {confirmDel && (
            <button
              onClick={() => setConfirmDel(false)}
              className="text-[10px] text-ink5 hover:text-ink px-1"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* ── Status action buttons — visible on hover ── */}
      {onStatusChange && actions.length > 0 && (
        <div className={cn("flex gap-1.5 mt-1.5 transition-all duration-150", moving ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          {actions.map((action) => (
            <button
              key={action.to}
              disabled={moving}
              onClick={() => handleMove(action.to)}
              className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors", action.style, moving && "cursor-wait")}
            >
              {moving ? "…" : (<><action.icon size={11} strokeWidth={2.5} /> {action.label}</>)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
