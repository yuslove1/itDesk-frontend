"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { TaskCompositionBar } from "@/components/ui/TaskCompositionBar";
import { TaskCard } from "@/components/ui/TaskCard";
import { LogEntryCard } from "@/components/ui/LogEntryCard";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { bucketByDay } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ClipboardList, Timer, CheckCircle2, FileText, KanbanSquare, NotebookPen, ArrowRight, Plus } from "lucide-react";

function mapTask(r) {
  const initials = r.author?.name
    ? r.author.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "IT";
  return {
    id: r.id, title: r.title, description: r.description ?? undefined,
    category: r.category ?? "hardware", priority: r.priority ?? "med", status: r.status,
    assignedTo: { id: r.author?.id ?? "unknown", name: r.author?.name ?? "IT Staff", initials, role: r.author?.role ?? "staff", department: "IT Dept" },
    isManagerAssigned: r.author?.role === "manager",
    createdAt: r.createdAt ? new Date(r.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--:--",
    // Raw timestamps (kept separately from the formatted `createdAt` above,
    // which the TaskCard corner display depends on) — used to bucket the
    // dashboard's stat-tile sparklines into real daily counts.
    createdAtRaw: r.createdAt,
    updatedAtRaw: r.updatedAt,
  };
}

// Last 7 days of log counts — the /logs endpoint only ever returns one day
// at a time (today, or a ?date= you pass), so a real trend needs one small
// request per day rather than a single fetch.
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Empty state component ────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center bg-surf border border-dashed border-border rounded-[10px]">
      <Image src={icon} alt="" width={44} height={44} className="mb-2" />
      <p className="text-[12px] font-semibold text-ink">{title}</p>
      <p className="text-[10px] text-ink5 mt-1">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logTrend, setLogTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/tasks"),
      api.get("/logs"),
    ])
      .then(([taskRes, logRes]) => {
        setTasks(taskRes.tasks.map(mapTask));
        setLogs(logRes.logs.map(mapLog));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    fetchLogTrend().then(setLogTrend).catch(() => setLogTrend(null));
  }, []);

  const todo = tasks.filter((t) => t.status === "todo");
  const wip = tasks.filter((t) => t.status === "wip");
  const done = tasks.filter((t) => t.status === "done");
  const active = tasks.filter((t) => t.status !== "done").slice(0, 3);

  // Real 7-day sparklines derived from data already on the page — no
  // fabricated trend. Open = tasks created/day; In progress & Done use
  // updatedAt as the best available proxy for "recently active" (the API
  // doesn't track status-change history separately from updatedAt).
  const openTrend = bucketByDay(tasks, (t) => t.createdAtRaw);
  const wipTrend   = bucketByDay(wip,  (t) => t.updatedAtRaw);
  const doneTrend  = bucketByDay(done, (t) => t.updatedAtRaw);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <AppShell user={user} subtitle="Dairies Plant">
      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      <div className="bg-surf border border-border rounded-[10px] px-5 py-4 mb-4 flex items-center justify-between animate-fade-up overflow-hidden relative">
        {/* Subtle left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-uac-green rounded-l-[10px]" />
        <div className="pl-2 flex items-center gap-3">
          <Image src="/icons/3d/sun_3d.png" alt="" width={36} height={36} className="hidden sm:block shrink-0" />
          <div>
            <h1 className="text-[18px] sm:text-[20px] font-bold tracking-tight text-ink">
              {getGreeting()}, {user?.name ?? "…"}
            </h1>
            <p className="text-[11px] text-ink5 mt-0.5">
              {today} · Dairies Plant IT Support
            </p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <span className="text-[10px] text-ink6 uppercase tracking-wider">Time</span>
          <span className="font-mono text-[13px] font-bold text-ink">
            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-5 animate-fade-up">
        <StatCard
          icon={ClipboardList} label="Open tasks"
          value={loading ? "…" : todo.length}
          detail={loading ? undefined : todo.length > 0 ? `${todo.length} need attention` : "All clear"}
          trend={loading ? undefined : openTrend}
          variant="red"
        />
        <StatCard
          icon={Timer} label="In progress"
          value={loading ? "…" : wip.length}
          detail={loading ? undefined : wip.length > 0 ? "Active now" : "None active"}
          trend={loading ? undefined : wipTrend}
          variant="amber"
        />
        <StatCard
          icon={CheckCircle2} label="Done today"
          value={loading ? "…" : done.length}
          detail={loading ? undefined : done.length > 0 ? "Good pace" : "Get started"}
          trend={loading ? undefined : doneTrend}
          variant="green"
        />
        <StatCard
          icon={FileText} label="Log entries"
          value={loading ? "…" : logs.length}
          detail="today"
          trend={logTrend}
        />
      </div>

      {/* ── Task composition ────────────────────────────────────────────────── */}
      {!loading && (
        <TaskCompositionBar todo={todo.length} wip={wip.length} done={done.length} />
      )}

      {/* ── Two-col widget area ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 animate-fade-up">
        {/* Active tasks */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
              <KanbanSquare size={13} strokeWidth={2.25} className="text-uac-red" /> Active tasks
            </h2>
            <Button variant="soft-green" size="sm" icon={ArrowRight} onClick={() => router.push("/tasks")}>
              View all
            </Button>
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-[8px]" />)}
            </div>
          ) : active.length === 0 ? (
            <EmptyState icon="/icons/3d/check_mark_button_3d.png" title="All clear!" sub="No active tasks — add one from Task Board" />
          ) : (
            <div className="flex flex-col gap-1.5">
              {active.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          )}
        </div>

        {/* Today's log */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-[13px] font-bold text-ink flex items-center gap-1.5">
              <NotebookPen size={13} strokeWidth={2.25} className="text-uac-green" /> Today&apos;s log
            </h2>
            <Button variant="outline-green" size="sm" icon={Plus} onClick={() => router.push("/log")}>
              Log entry
            </Button>
          </div>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-[8px]" />)}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState icon="/icons/3d/memo_3d.png" title="No entries yet" sub="Log your first activity for today" />
          ) : (
            <div className="flex flex-col gap-1.5">
              {logs.slice(0, 3).map((entry) => <LogEntryCard key={entry.id} entry={entry} compact />)}
              {logs.length > 3 && (
                <button
                  onClick={() => router.push("/log")}
                  className="text-[11px] text-uac-green hover:underline text-center pt-1 flex items-center justify-center gap-1"
                >
                  +{logs.length - 3} more entries <ArrowRight size={12} strokeWidth={2.25} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
