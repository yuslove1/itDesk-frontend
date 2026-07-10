"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/AppShell";
import { HandoverCard } from "@/components/ui/HandoverCard";
import { Button } from "@/components/ui/Button";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isRequired, sanitizeInput } from "@/lib/validators";
import { X, AlertTriangle, ArrowRight } from "lucide-react";

function mapNote(r) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    isActive: r.isActive,
    updatedAt: r.createdAt
      ? `Updated ${new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : "Just now",
  };
}

const inputCls = "w-full bg-paper border border-border rounded-[6px] px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-uac-green transition-colors";
const labelCls = "text-[11px] font-semibold text-ink4 block mb-1.5";

// ── Edit Note modal ─────────────────────────────────────────────────────────
function EditNoteModal({ note, onClose, onUpdated }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanTitle   = sanitizeInput(title);
    const cleanContent = sanitizeInput(content);
    if (!isRequired(cleanTitle) || !isRequired(cleanContent)) {
      setError("Title and content are both required");
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch(`/handover/${note.id}`, {
        title: cleanTitle,
        content: cleanContent,
      });
      onUpdated(mapNote(res.note));
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to update note");
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
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink4">Edit handover note</p>
          <button type="button" onClick={onClose} className="text-ink5 hover:text-ink"><X size={16} strokeWidth={2.25} /></button>
        </div>

        <div className="mb-3">
          <label className={labelCls}>Title</label>
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus required
          />
        </div>

        <div className="mb-4">
          <label className={labelCls}>Content</label>
          <textarea
            className={cn(inputCls, "resize-none min-h-[100px]")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-[11px] text-uac-red mb-2 bg-uac-red-soft px-2 py-1 rounded">
            <AlertTriangle size={13} strokeWidth={2.25} /> {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="green" icon={ArrowRight} className="flex-1 justify-center" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function HandoverPage() {
  const user = useCurrentUser();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState(null);

  const canManage = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    api.get("/handover")
      .then((res) => setNotes(res.notes.map(mapNote)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanTitle   = sanitizeInput(title);
    const cleanContent = sanitizeInput(content);
    if (!isRequired(cleanTitle) || !isRequired(cleanContent)) {
      setError("Title and content are both required");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/handover", {
        title: cleanTitle,
        content: cleanContent,
      });
      setNotes((prev) => [mapNote(res.note), ...prev]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message ?? "Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote(id) {
    try {
      await api.delete(`/handover/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete note failed:", err);
    }
  }

  function handleNoteUpdated(updated) {
    setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
  }

  return (
    <>
      <AppShell user={user} subtitle="Handover Notes">
        <h1 className="text-[16px] sm:text-[18px] font-bold tracking-tight text-ink mb-0.5">Handover Notes</h1>
        <p className="text-[11px] text-ink5 mb-4">
          Context for the next IT person · {notes.length} active notes
          {canManage && <span className="ml-2 text-uac-green">· hover a note to edit or delete</span>}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
          {/* Active notes */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[12px] font-bold text-ink">Active notes</h2>
            </div>
            {loading ? (
              <p className="text-[11px] text-ink5">Loading…</p>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-surf border border-dashed border-border rounded-[10px]">
                <Image src="/icons/3d/wrench_3d.png" alt="" width={40} height={40} className="mb-2" />
                <p className="text-[12px] font-semibold text-ink">No handover notes yet</p>
                <p className="text-[10px] text-ink5 mt-1">Add your first one using the form</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notes.map((note) => (
                  <HandoverCard
                    key={note.id}
                    note={note}
                    onDelete={canManage ? handleDeleteNote : undefined}
                    onEdit={canManage ? setEditingNote : undefined}
                  />
                ))}
              </div>
            )}
          </div>

          {/* New note form */}
          <form onSubmit={handleSubmit} className="bg-surf border border-border rounded-[10px] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink4 mb-3">
              New handover note
            </p>
            <div className="mb-3">
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                placeholder="e.g. UPS maintenance schedule"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Content</label>
              <textarea
                className={cn(inputCls, "resize-none min-h-[90px]")}
                placeholder="What does the next person need to know?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-[11px] text-uac-red mb-2 bg-uac-red-soft px-2 py-1 rounded">
                <AlertTriangle size={13} strokeWidth={2.25} /> {error}
              </p>
            )}

            <Button variant="green" icon={ArrowRight} type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save note"}
            </Button>
          </form>
        </div>
      </AppShell>

      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onUpdated={(updated) => { handleNoteUpdated(updated); setEditingNote(null); }}
        />
      )}
    </>
  );
}
