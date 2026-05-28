"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

const ACTIVITY_TYPES = [
  { value: "APPLICATION", label: "Application submitted" },
  { value: "NETWORKING", label: "Networking / outreach" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "RESEARCH", label: "Job research" },
  { value: "TRAINING", label: "Training / certification" },
  { value: "OTHER", label: "Other" },
] as const;

export function ActivityLogForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      date: form.get("date"),
      type: form.get("type"),
      description: form.get("description"),
      company: form.get("company") || undefined,
      roleTitle: form.get("roleTitle") || undefined,
      hoursSpent: form.get("hoursSpent") || 0,
    };

    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError("Could not save activity. Please try again.");
      setLoading(false);
      return;
    }

    router.refresh();
    e.currentTarget.reset();
    setLoading(false);
  }

  return (
    <Card>
      <CardTitle>Log job search activity</CardTitle>
      <CardDescription>
        Record what you did today so your program manager can track your
        progress.
      </CardDescription>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-1 block text-sm font-medium text-stone-700">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={today}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>

          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-stone-700">
              Activity type
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-stone-700">
            What did you do?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="e.g. Applied to warehouse position at Target, updated resume"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="company" className="mb-1 block text-sm font-medium text-stone-700">
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              placeholder="Optional"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
          <div>
            <label htmlFor="roleTitle" className="mb-1 block text-sm font-medium text-stone-700">
              Role
            </label>
            <input
              id="roleTitle"
              name="roleTitle"
              type="text"
              placeholder="Optional"
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
            />
          </div>
        </div>

        <div>
          <label htmlFor="hoursSpent" className="mb-1 block text-sm font-medium text-stone-700">
            Hours spent
          </label>
          <input
            id="hoursSpent"
            name="hoursSpent"
            type="number"
            min={0}
            max={24}
            step={0.5}
            defaultValue={1}
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Saving…" : "Save activity"}
        </Button>
      </form>
    </Card>
  );
}
