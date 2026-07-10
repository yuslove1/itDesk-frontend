"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanColumn } from "@/components/ui/KanbanColumn";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRequired, sanitizeInput } from "@/lib/validators";
import { getSocket } from "@/lib/socket";
import { Plus, X, AlertTriangle, ArrowRight } from "lucide-react";

// ── API → UI mapper ───────────────────────────────────────────────────────────
function mapTask(r) {
  const initials = r.author?.name
    ? r.author.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "IT";
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    category: r.category ?? "hardware",
    priority: r.priority ?? "med",
    status: r.status,
    assignedTo: {
      id: r.author?.id ?? "unknown",
      name: r.author?.name ?? "IT Staff",
      initials,
      role: r.author?.role ?? "staff",
      department: "IT Dept",
    },
    isManagerAssigned: r.author?.role === "manager",
    createdAt: r.createdAt
      ? new Date(r.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : "--:--",
  };
}

const CATEGORIES = ["hardware", "network", "software", "urgent"];
const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "med",  label: "Medium" },
  { value: "low",  label: "Low" },
];
const STATUS_LABEL = { todo: "To Do", wip: "In Progress", done: "Done" };

// ── Shared form fields ─────────────────────────────────────────────────────────
const inputCls = "w-full bg-paper border border-border rounded-[6px] px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-uac-green transition-colors";
const labelCls = "text-[11px] font-semibold text-ink4 block mb-1.5";

// ── Add Task modal ────────────────────────────────────────────────────────────
function AddTaskForm({ onClose, onCreated, initialStatus = "todo" }) {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("hardware");
  const [priority,    setPriority]    = useState("med");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanTitle = sanitizeInput(title);
    if (!isRequired(cleanTitle)) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/tasks", {
        title: cleanTitle,
        description: sanitizeInput(description) || undefined,
        category,
        priority,
        status: initialStatus,
      });
      onCreated(mapTask(res.task));
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to create task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-surf border border-border rounded-[12px] shadow-[0_8px_40px_rgba(17,19,24,0.18)] w-full max-w-md p-5 animate-fade-up"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink4">New task · {STATUS_LABEL[initialStatus]}</p>
          <button type="button" onClick={onClose} className="text-ink5 hover:text-ink"><X size={16} strokeWidth={2.25} /></button>
        </div>

        <div className="mb-3">
          <label className={labelCls}>Title *</label>
          <input
            className={inputCls}
            placeholder="e.g. Replace toner in Production office printer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus required
          />
        </div>

        <div className="mb-3">
          <label className={labelCls}>Description (optional)</label>
          <textarea
            className={cn(inputCls, "resize-none min-h-[60px]")}
            placeholder="Any extra context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-[11px] text-uac-red bg-uac-red-soft px-2.5 py-1.5 rounded-[6px] mb-3">
            <AlertTriangle size={13} strokeWidth={2.25} /> {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="green" icon={ArrowRight} disabled={saving} className="flex-1 justify-center">
            {saving ? "Creating…" : `Add to ${STATUS_LABEL[initialStatus]}`}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Edit Task modal ───────────────────────────────────────────────────────────
function EditTaskForm({ task, onClose, onUpdated }) {
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [category,    setCategory]    = useState(task.category);
  const [priority,    setPriority]    = useState(task.priority);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanTitle = sanitizeInput(title);
    if (!isRequired(cleanTitle)) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch(`/tasks/${task.id}`, {
        title: cleanTitle,
        description: sanitizeInput(description) || undefined,
        category,
        priority,
      });
      onUpdated(mapTask(res.task));
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-surf border border-border rounded-[12px] shadow-[0_8px_40px_rgba(17,19,24,0.18)] w-full max-w-md p-5 animate-fade-up"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink4">Edit task</p>
          <button type="button" onClick={onClose} className="text-ink5 hover:text-ink"><X size={16} strokeWidth={2.25} /></button>
        </div>

        <div className="mb-3">
          <label className={labelCls}>Title *</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus required
          />
        </div>

        <div className="mb-3">
          <label className={labelCls}>Description (optional)</label>
          <textarea
            className={cn(inputCls, "resize-none min-h-[60px]")}
            placeholder="Any extra context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-[11px] text-uac-red bg-uac-red-soft px-2.5 py-1.5 rounded-[6px] mb-3">
            <AlertTriangle size={13} strokeWidth={2.25} /> {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" variant="green" icon={ArrowRight} disabled={saving} className="flex-1 justify-center">
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Tasks Page ────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const user = useCurrentUser();
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [addStatus,   setAddStatus]   = useState("todo");
  const [editingTask, setEditingTask] = useState(null);

  const canManage = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    api.get("/tasks")
      .then((res) => setTasks(res.tasks.map(mapTask)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Live updates from other connected clients (see itDesk_api/index.js for
  // where these events are emitted) ──────────────────────────────────────────
  // WHY DEDUPE ON "created" BUT NOT ON "updated"/"deleted"?
  // The server broadcasts to every connected client, including whoever made
  // the request in the first place. On create, THIS client already added the
  // task locally via AddTaskForm's onCreated callback (an optimistic update,
  // so the UI feels instant) — the socket event for that same task arrives a
  // moment later and would duplicate it if just prepended blindly. Update and
  // delete are naturally idempotent (mapping/filtering by id is a no-op if
  // the id isn't there, and harmless if it already reflects the new state),
  // so they don't need the same guard.
  useEffect(() => {
    const socket = getSocket();

    function handleCreated(task) {
      setTasks((prev) => (
        prev.some((t) => t.id === task.id) ? prev : [mapTask(task), ...prev]
      ));
    }
    function handleUpdated(task) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? mapTask(task) : t)));
    }
    function handleDeleted({ id }) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }

    socket.on("task:created", handleCreated);
    socket.on("task:updated", handleUpdated);
    socket.on("task:deleted", handleDeleted);

    // Remove these specific listeners on unmount — leaving them attached
    // would mean navigating away and back stacks up duplicate handlers, each
    // firing on every future event.
    return () => {
      socket.off("task:created", handleCreated);
      socket.off("task:updated", handleUpdated);
      socket.off("task:deleted", handleDeleted);
    };
  }, []);

  // ── Optimistic status move ─────────────────────────────────────────────────
  async function handleStatusChange(taskId, newStatus) {
    const prev = tasks.find((t) => t.id === taskId)?.status;
    setTasks((all) => all.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
    } catch (err) {
      console.error("Status update failed — rolling back", err);
      if (prev) setTasks((all) => all.map((t) => t.id === taskId ? { ...t, status: prev } : t));
    }
  }

  // ── Delete task ────────────────────────────────────────────────────────────
  async function handleDeleteTask(taskId) {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((all) => all.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Delete task failed:", err);
    }
  }

  // ── Update task after edit ─────────────────────────────────────────────────
  function handleTaskUpdated(updated) {
    setTasks((all) => all.map((t) => t.id === updated.id ? updated : t));
  }

  const todo = tasks.filter((t) => t.status === "todo");
  const wip  = tasks.filter((t) => t.status === "wip");
  const done = tasks.filter((t) => t.status === "done");

  function openAddForm(status) {
    setAddStatus(status);
    setShowForm(true);
  }

  return (
    <>
      <AppShell
        user={user}
        subtitle="Task Board"
        topbarActions={
          <Button variant="soft-green" size="sm" icon={Plus} onClick={() => openAddForm("todo")}>
            New Task
          </Button>
        }
      >
        <h1 className="text-[16px] sm:text-[18px] font-bold tracking-tight text-ink mb-0.5">Task Board</h1>
        <p className="text-[11px] text-ink5 mb-4 sm:mb-5 leading-relaxed">
          {loading
            ? "Loading tasks…"
            : `${todo.length} open · ${wip.length} in progress · ${done.length} done`}
          <span className="hidden sm:inline"> · hover a card to move it between columns</span>
          {canManage && <span className="ml-2 text-uac-green">· admin/manager: hover to edit or delete</span>}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-[10px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            <KanbanColumn
              title="To Do"
              tasks={todo}
              dotColor="gray"
              onStatusChange={handleStatusChange}
              onDelete={canManage ? handleDeleteTask : undefined}
              onEdit={canManage ? setEditingTask : undefined}
              onAddCard={() => openAddForm("todo")}
            />
            <KanbanColumn
              title="In Progress"
              tasks={wip}
              dotColor="amber"
              onStatusChange={handleStatusChange}
              onDelete={canManage ? handleDeleteTask : undefined}
              onEdit={canManage ? setEditingTask : undefined}
              onAddCard={() => openAddForm("wip")}
            />
            <div className="md:col-span-2 xl:col-span-1">
              <KanbanColumn
                title="Done"
                tasks={done}
                dotColor="green"
                onStatusChange={handleStatusChange}
                onDelete={canManage ? handleDeleteTask : undefined}
                onEdit={canManage ? setEditingTask : undefined}
                onAddCard={() => openAddForm("done")}
              />
            </div>
          </div>
        )}
      </AppShell>

      {showForm && (
        <AddTaskForm
          initialStatus={addStatus}
          onClose={() => setShowForm(false)}
          onCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
        />
      )}

      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onUpdated={(updated) => { handleTaskUpdated(updated); setEditingTask(null); }}
        />
      )}
    </>
  );
}
