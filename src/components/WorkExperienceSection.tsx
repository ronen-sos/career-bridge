"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import {
  AccomplishmentsInput,
  type AccomplishmentsInputHandle,
} from "@/components/AccomplishmentsInput";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDateRange } from "@/lib/format";

export type WorkExperienceItem = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  accomplishments: string[];
};

type FormData = {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  accomplishments: string[];
};

const emptyForm: FormData = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  accomplishments: [],
};

function toDateInput(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function WorkExperienceSection({
  experiences,
}: {
  experiences: WorkExperienceItem[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accomplishmentsRef = useRef<AccomplishmentsInputHandle>(null);

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function startEdit(exp: WorkExperienceItem) {
    setEditingId(exp.id);
    setForm({
      company: exp.company,
      title: exp.title,
      startDate: toDateInput(exp.startDate),
      endDate: toDateInput(exp.endDate),
      isCurrent: exp.isCurrent,
      accomplishments: [...exp.accomplishments],
    });
    setShowForm(true);
    setError(null);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const accomplishments =
      accomplishmentsRef.current?.commitPending() ?? form.accomplishments;

    if (accomplishments.length === 0) {
      setError(
        "Describe at least one result from this role — like improved satisfaction, serving more clients, or solving a problem.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    const payload = { ...form, accomplishments };

    const url = editingId
      ? `/api/profile/work/${editingId}`
      : "/api/profile/work";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not save work experience. Please check your entries.",
      );
      setLoading(false);
      return;
    }

    cancelForm();
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this work experience?")) return;

    const res = await fetch(`/api/profile/work/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      {experiences.length > 0 && (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <Card key={exp.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-stone-900">{exp.title}</h4>
                  <p className="text-sm text-stone-600">{exp.company}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(exp)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-emerald-700"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3">
                {exp.accomplishments.map((a, i) => (
                  <li key={i} className="text-sm text-stone-700">
                    • {a}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {showForm ? (
        <Card>
          <CardTitle>
            {editingId ? "Edit work experience" : "Add work experience"}
          </CardTitle>
          <CardDescription>
            Include every job, volunteer role, or relevant experience. Be specific
            about what you achieved — this powers your tailored resumes.
          </CardDescription>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Job title
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Warehouse Associate"
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Company / organization
                </label>
                <input
                  required
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g. Target Distribution Center"
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Start date
                </label>
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  End date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  disabled={form.isCurrent}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.isCurrent}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isCurrent: e.target.checked,
                    endDate: e.target.checked ? "" : form.endDate,
                  })
                }
                className="h-4 w-4 rounded border-stone-300"
              />
              I currently work here
            </label>

            <AccomplishmentsInput
              ref={accomplishmentsRef}
              value={form.accomplishments}
              onChange={(accomplishments) =>
                setForm({ ...form, accomplishments })
              }
              placeholder="e.g. Increased customer satisfaction from 7/10 to 9/10 by following up with every client"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : editingId ? "Update" : "Add experience"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button onClick={startAdd} variant="secondary" className="w-full sm:w-auto">
          + Add work experience
        </Button>
      )}
    </div>
  );
}
