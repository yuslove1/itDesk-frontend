"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { TaskCompositionBar } from "@/components/ui/TaskCompositionBar";
import { TaskCard } from "@/components/ui/TaskCard";
import { LogEntryCard } from "@/components/ui/LogEntryCard";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { bucketByDay } from "@/lib/utils";
import { ClipboardList, Timer, CheckCircle2, FileText, KanbanSquare, NotebookPen, ClipboardPlus } from "lucide-react";

// ── Mappers ───────────────────────────────────────────────────────────────────
function mapTask(r) {
  const initials = r.author?.name
    ? r.author.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "IT";
  return {
    id: r.id, title: r.title, description: r.description ?? undefined,
    category: r.category ?? "hardware", priority: r.priority ?? "med", status: r.status,
    assignedTo: { id: r.author?.id ?? "?", name: r.author?.name ?? "IT Staff", initials, role: r.author?.role ?? "staff", department: "IT Dept" },
    isManagerAssigned: r.author?.role === "manager",
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--",
    // Raw timestamps for the stat-tile sparklines — see dashboard/page.jsx's
    // mapTask for why these are kept separate from the formatted `createdAt`.
    createdAtRaw: r.createdAt,
    updatedAtRaw: r.updatedAt,
  };
}

// Last 7 days of log counts — /logs only ever returns one day at a time.
async function fetchLogTrend(days = 7) {
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const results = await Promise.all(
    dates.map((date) => api.get(`/logs?date=${date}`).catch(() => ({ logs: [] }))),
  );
  return results.map((r) => r.logs.length);
}

function mapLog(r) {
  return {
    id: r.id,
    time: r.logDate ? new Date(r.logDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--",
    description: r.content,
    category: r.category ?? "routine",
    date: r.logDate ? r.logDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export default function ManagerDashboardPage() {
  const user   = useCurrentUser();
  const router = useRouter();

  const [tasks,    setTasks]    = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [logTrend, setLogTrend] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tasks"),
      api.get("/logs"),
    ])
      .then(([t, l]) => {
        setTasks(t.tasks.map(mapTask));
        setLogs(l.logs.map(mapLog));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchLogTrend().then(setLogTrend).catch(() => setLogTrend(null));
  }, []);

  // Managers can still change task status
  async function handleStatusChange(taskId, newStatus) {
    const prev = tasks.find((t) => t.id === taskId)?.status;
    setTasks((all) => all.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch {
      if (prev) setTasks((all) => all.map((t) => t.id === taskId ? { ...t, status: prev } : t));
    }
  }

  const todo    = tasks.filter((t) => t.status === "todo");
  const wip     = tasks.filter((t) => t.status === "wip");
  const done    = tasks.filter((t) => t.status === "done");
  const openAll = tasks.filter((t) => t.status !== "done");

  // Real 7-day sparklines — see dashboard/page.jsx for the same derivation.
  const openTrend = bucketByDay(tasks, (t) => t.createdAtRaw);
  const wipTrend  = bucketByDay(wip,  (t) => t.updatedAtRaw);
  const doneTrend = bucketByDay(done, (t) => t.updatedAtRaw);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <AppShell
      user={user}
      subtitle="Manager View"
      topbarActions={
        <Button variant="soft-green" size="sm" icon={ClipboardPlus} onClick={() => router.push("/manager/create-task")}>
          Create &amp; Assign Task
        </Button>
      }
    >
      {/* Manager banner */}
      <div className="rounded-[10px] bg-gradient-to-br from-uac-red-deep to-[#3a0818] border border-uac-red/30 px-5 py-4 flex items-center gap-3.5 mb-4 animate-fade-up relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
        <Image src="/icons/3d/clipboard_3d.png" alt="" width={36} height={36} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-white">Manager Dashboard</p>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">
            {today} · Dairies Plant IT Support · Read + Create tasks
          </p>
        </div>
        <span className="ml-auto text-[10px] font-semibold px-2 py-1 rounded bg-uac-green/25 text-uac-green-mid border border-uac-green/40 uppercase tracking-wide shrink-0 hidden sm:inline">
          Manager view
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-4 sm:mb-5 animate-fade-up">
        <StatCard icon={ClipboardList} label="Open tasks"   value={loading ? "…" : todo.length}  variant="red"   detail={todo.length > 0 ? "need attention" : "all clear"} trend={loading ? undefined : openTrend} />
        <StatCard icon={Timer}         label="In progress"  value={loading ? "…" : wip.length}   variant="amber" detail={wip.length > 0 ? "active now" : "none active"} trend={loading ? undefined : wipTrend} />
        <StatCard icon={CheckCircle2}  label="Done today"   value={loading ? "…" : done.length}  variant="green" detail={done.length > 0 ? "completed" : "get started"} trend={loading ? undefined : doneTrend} />
        <StatCard icon={FileText}      label="Log entries"  value={loading ? "…" : logs.length}  detail="today" trend={logTrend} />
      </div>

      {/* ── Task composition ────────────────────────────────────────────────── */}
      {!loading && (
        <TaskCompositionBar todo={todo.length} wip={wip.length} done={done.length} />
      )}

      {/* Two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-up">
        {/* All open tasks */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
              <KanbanSquare size={13} strokeWidth={2.25} className="text-uac-red" />
              All tasks <span className="text-[10px] font-normal text-ink5 ml-1">({openAll.length} open)</span>
            </h2>
            <Button variant="green" size="sm" icon={ClipboardPlus} onClick={() => router.push("/manager/create-task")}>
              Create &amp; Assign
            </Button>
          </div>

          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-[8px]" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-surf border border-dashed border-border rounded-[10px] text-center">
              <Image src="/icons/3d/check_mark_button_3d.png" alt="" width={44} height={44} className="mb-2" />
              <p className="text-[12px] font-semibold text-ink">No tasks yet</p>
              <p className="text-[10px] text-ink5 mt-1">Create the first one to get started</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {tasks.slice(0, 6).map((task) => (
                <TaskCard key={task.id} task={task} muted={task.status === "done"} onStatusChange={handleStatusChange} />
              ))}
              {tasks.length > 6 && (
                <p className="text-[11px] text-ink5 text-center pt-1">
                  +{tasks.length - 6} more · <button onClick={() => router.push("/tasks")} className="text-uac-green hover:underline">View all on board</button>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Today's activity */}
        <div>
          <h2 className="text-[13px] font-bold text-ink flex items-center gap-1.5 mb-2.5">
            <NotebookPen size={13} strokeWidth={2.25} className="text-uac-green" /> Today&apos;s activity
          </h2>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-[8px]" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 bg-surf border border-dashed border-border rounded-[10px] text-center">
              <Image src="/icons/3d/memo_3d.png" alt="" width={44} height={44} className="mb-2" />
              <p className="text-[12px] font-semibold text-ink">No log entries yet</p>
              <p className="text-[10px] text-ink5 mt-1">Staff haven&apos;t logged anything today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {logs.slice(0, 5).map((entry) => (
                <LogEntryCard key={entry.id} entry={entry} compact />
              ))}
              {logs.length > 5 && (
                <p className="text-[11px] text-ink5 text-center pt-1">
                  +{logs.length - 5} more entries today
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
