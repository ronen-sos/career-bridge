"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { formatHourBreakdown } from "@/lib/goals/progress";

type DailyUpdate = {
  id: string;
  date: string;
  applicationsCount: number;
  interviewsCount: number;
  jobSeekingHours: number;
  employmentHours: number;
  educationHours: number;
  notes: string;
  managerReviewed: boolean;
  managerNotes: string | null;
  customCompletions?: Array<{
    customItemId: string;
    completed: boolean;
    customItem?: { id: string; label: string };
  }>;
};

type CustomItem = {
  id: string;
  label: string;
};

export function DailyUpdateForm({
  goalId,
  weekStart,
  customItems,
}: {
  goalId: string;
  weekStart: string;
  customItems: CustomItem[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const today = new Date().toISOString().split("T")[0];

  function toggleCustomItem(id: string) {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      date: form.get("date"),
      applicationsCount: form.get("applicationsCount") || 0,
      interviewsCount: form.get("interviewsCount") || 0,
      jobSeekingHours: form.get("jobSeekingHours") || 0,
      employmentHours: form.get("employmentHours") || 0,
      educationHours: form.get("educationHours") || 0,
      notes: form.get("notes"),
      customCompletions: customItems.map((item) => ({
        customItemId: item.id,
        completed: !!checkedItems[item.id],
      })),
    };

    const res = await fetch(`/api/goals/${goalId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      if (typeof data.error === "string") {
        setError(data.error);
      } else if (data.error?.notes) {
        setError(data.error.notes[0]);
      } else {
        setError("Could not save update.");
      }
      setLoading(false);
      return;
    }

    router.refresh();
    e.currentTarget.reset();
    const dateInput = e.currentTarget.elements.namedItem("date") as HTMLInputElement;
    if (dateInput) dateInput.value = today!;
    setCheckedItems({});
    setLoading(false);
  }

  return (
    <Card>
      <CardTitle>Daily check-in</CardTitle>
      <CardDescription>
        Log what you accomplished today toward your weekly goals. Your manager
        will review each update.
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="updateDate" className="mb-1 block text-sm font-medium text-stone-700">
            Date
          </label>
          <input
            id="updateDate"
            name="date"
            type="date"
            defaultValue={today}
            min={weekStart}
            required
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base sm:max-w-xs"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="applicationsCount"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Applications sent
            </label>
            <input
              id="applicationsCount"
              name="applicationsCount"
              type="number"
              min={0}
              max={50}
              defaultValue={0}
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
          <div>
            <label
              htmlFor="interviewsCount"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Interviews held
            </label>
            <input
              id="interviewsCount"
              name="interviewsCount"
              type="number"
              min={0}
              max={20}
              defaultValue={0}
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">Hours today</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="jobSeekingHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Job seeking
              </label>
              <input
                id="jobSeekingHours"
                name="jobSeekingHours"
                type="number"
                min={0}
                max={24}
                step={0.5}
                defaultValue={0}
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="employmentHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Employment
              </label>
              <input
                id="employmentHours"
                name="employmentHours"
                type="number"
                min={0}
                max={24}
                step={0.5}
                defaultValue={0}
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
            <div>
              <label
                htmlFor="educationHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Education
              </label>
              <input
                id="educationHours"
                name="educationHours"
                type="number"
                min={0}
                max={24}
                step={0.5}
                defaultValue={0}
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
              />
            </div>
          </div>
        </div>

        {customItems.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">
              Custom goals for this week
            </p>
            <ul className="space-y-2">
              {customItems.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => toggleCustomItem(item.id)}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-emerald-700"
                    />
                    <span className="text-sm text-stone-800">{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-stone-500">
              Check off any custom goals you completed today.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-stone-700">
            What did you accomplish?
          </label>
          <textarea
            id="notes"
            name="notes"
            required
            rows={3}
            placeholder="Be specific — which companies, roles, or interviews? What blocked you?"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Submitting…" : "Submit daily update"}
        </Button>
      </form>
    </Card>
  );
}

export function DailyUpdateList({
  updates,
  goalId,
  canReview = false,
  customItems = [],
}: {
  updates: DailyUpdate[];
  goalId: string;
  canReview?: boolean;
  customItems?: CustomItem[];
}) {
  const router = useRouter();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markReviewed(updateId: string) {
    setLoadingId(updateId);
    await fetch(`/api/goals/${goalId}/updates/${updateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        managerNotes: reviewNotes[updateId] || undefined,
      }),
    });
    router.refresh();
    setLoadingId(null);
  }

  if (updates.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-stone-500">
        No daily updates yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {updates.map((update) => (
        <li
          key={update.id}
          className={`rounded-2xl border p-4 ${
            !update.managerReviewed && canReview
              ? "border-amber-200 bg-amber-50"
              : "border-stone-200 bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-stone-900">{formatDate(update.date)}</p>
              <p className="mt-1 text-sm text-stone-600">
                {update.applicationsCount} application
                {update.applicationsCount === 1 ? "" : "s"} ·{" "}
                {update.interviewsCount} interview
                {update.interviewsCount === 1 ? "" : "s"}
                {formatHourBreakdown(update) && (
                  <>
                    {" "}
                    · {formatHourBreakdown(update)} hrs
                  </>
                )}
              </p>
            </div>
            {update.managerReviewed ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Reviewed
              </span>
            ) : canReview ? (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Needs review
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                Pending review
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
            {update.notes}
          </p>
          {update.customCompletions?.some((c) => c.completed) && (
            <ul className="mt-2 space-y-1">
              {update.customCompletions
                .filter((c) => c.completed)
                .map((c) => {
                  const label =
                    c.customItem?.label ??
                    customItems.find((item) => item.id === c.customItemId)?.label ??
                    "Custom goal";
                  return (
                    <li
                      key={c.customItemId}
                      className="text-sm text-emerald-800"
                    >
                      ✓ {label}
                    </li>
                  );
                })}
            </ul>
          )}
          {update.managerNotes && (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <span className="font-medium">Manager: </span>
              {update.managerNotes}
            </p>
          )}
          {canReview && !update.managerReviewed && (
            <div className="mt-3">
              <textarea
                placeholder="Optional feedback…"
                value={reviewNotes[update.id] ?? ""}
                onChange={(e) =>
                  setReviewNotes((prev) => ({
                    ...prev,
                    [update.id]: e.target.value,
                  }))
                }
                rows={2}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              <Button
                size="sm"
                className="mt-2"
                disabled={loadingId === update.id}
                onClick={() => markReviewed(update.id)}
              >
                {loadingId === update.id ? "Saving…" : "Mark reviewed"}
              </Button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
