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

export type EducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  accomplishments: string[];
};

type FormData = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  accomplishments: string[];
};

const emptyForm: FormData = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  accomplishments: [],
};

function toDateInput(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

export function EducationSection({ education }: { education: EducationItem[] }) {
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

  function startEdit(entry: EducationItem) {
    setEditingId(entry.id);
    setForm({
      institution: entry.institution,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy ?? "",
      startDate: toDateInput(entry.startDate),
      endDate: toDateInput(entry.endDate),
      isCurrent: entry.isCurrent,
      accomplishments: [...entry.accomplishments],
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
        "Describe at least one highlight — like honors earned, skills gained, or results from your training.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    const url = editingId
      ? `/api/profile/education/${editingId}`
      : "/api/profile/education";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        accomplishments,
        fieldOfStudy: form.fieldOfStudy || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.error === "string"
          ? data.error
          : "Could not save education entry. Please check your entries.",
      );
      setLoading(false);
      return;
    }

    cancelForm();
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this education entry?")) return;

    const res = await fetch(`/api/profile/education/${id}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-4">
      {education.length > 0 && (
        <div className="space-y-3">
          {education.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-stone-900">
                    {entry.degree}
                    {entry.fieldOfStudy && (
                      <span className="font-normal text-stone-600">
                        {" "}
                        in {entry.fieldOfStudy}
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-stone-600">{entry.institution}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDateRange(
                      entry.startDate,
                      entry.endDate,
                      entry.isCurrent,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-emerald-700"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3">
                {entry.accomplishments.map((a, i) => (
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
            {editingId ? "Edit education" : "Add education or training"}
          </CardTitle>
          <CardDescription>
            Include degrees, certifications, vocational training, and relevant
            coursework. Highlight outcomes like GPA, honors, or skills gained.
          </CardDescription>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Degree / credential
                </label>
                <input
                  required
                  value={form.degree}
                  onChange={(e) => setForm({ ...form, degree: e.target.value })}
                  placeholder="e.g. High School Diploma, OSHA 10 Certification"
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  Institution
                </label>
                <input
                  required
                  value={form.institution}
                  onChange={(e) =>
                    setForm({ ...form, institution: e.target.value })
                  }
                  placeholder="e.g. Lincoln High School, Community College"
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Field of study (optional)
              </label>
              <input
                value={form.fieldOfStudy}
                onChange={(e) =>
                  setForm({ ...form, fieldOfStudy: e.target.value })
                }
                placeholder="e.g. Business Administration, Welding"
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
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
              Currently enrolled
            </label>

            <AccomplishmentsInput
              ref={accomplishmentsRef}
              value={form.accomplishments}
              onChange={(accomplishments) =>
                setForm({ ...form, accomplishments })
              }
              label="Highlights & accomplishments"
              placeholder="e.g. Graduated with honors; completed 120 hours of forklift safety training"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : editingId ? "Update" : "Add education"}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button onClick={startAdd} variant="secondary" className="w-full sm:w-auto">
          + Add education or training
        </Button>
      )}
    </div>
  );
}
