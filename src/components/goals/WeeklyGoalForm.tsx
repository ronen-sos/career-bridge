"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
} from "@/lib/goals/progress";
import { cn } from "@/lib/cn";
import {
  DEFAULT_HOUR_TARGETS,
  MIN_WEEKLY_HOURS,
} from "@/lib/goals/hours";

type CustomItem = {
  id: string;
  label: string;
};

type GoalData = {
  id: string;
  weekStart: string;
  targetApplications: number;
  targetInterviews: number;
  targetJobSeekingHours: number;
  targetEmploymentHours: number;
  targetEducationHours: number;
  notes: string | null;
  status: string;
  managerApprovalNotes: string | null;
  weekReviewNotes: string | null;
  createdBy: { name: string; role: string };
  customItems?: CustomItem[];
};

type WeeklyGoalFormProps = {
  goal: GoalData | null;
  weekStart: string;
  participantId?: string;
  readOnly?: boolean;
};

export function WeeklyGoalForm({
  goal,
  weekStart,
  participantId,
  readOnly = false,
}: WeeklyGoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<Array<{ id?: string; label: string }>>(
    goal?.customItems?.map((item) => ({ id: item.id, label: item.label })) ?? [],
  );
  const [newCustomItem, setNewCustomItem] = useState("");

  const isManagerForm = !!participantId;

  const editable =
    !readOnly &&
    (!goal ||
      goal.status === "DRAFT" ||
      (isManagerForm &&
        (goal.status === "PENDING_APPROVAL" || goal.status === "ACTIVE")));

  function addCustomItem() {
    const label = newCustomItem.trim();
    if (label.length < 3 || customItems.length >= 10) return;
    setCustomItems((prev) => [...prev, { label }]);
    setNewCustomItem("");
  }

  function removeCustomItem(index: number) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      weekStart,
      participantId,
      targetApplications: form.get("targetApplications"),
      targetInterviews: form.get("targetInterviews"),
      targetJobSeekingHours: form.get("targetJobSeekingHours"),
      targetEmploymentHours: form.get("targetEmploymentHours"),
      targetEducationHours: form.get("targetEducationHours"),
      notes: form.get("notes") || undefined,
      customItems,
    };

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Could not save goals.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  async function submitForApproval() {
    if (!goal) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit" }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Could not submit.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Weekly goals</CardTitle>
          <CardDescription>
            Set application and interview targets, then allocate at least{" "}
            {MIN_WEEKLY_HOURS} weekly hours across job seeking, employment, and
            education.
          </CardDescription>
        </div>
        {goal && (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              GOAL_STATUS_COLORS[goal.status] ?? GOAL_STATUS_COLORS.DRAFT,
            )}
          >
            {GOAL_STATUS_LABELS[goal.status] ?? goal.status}
          </span>
        )}
      </div>

      {goal?.managerApprovalNotes && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="font-medium">Manager: </span>
          {goal.managerApprovalNotes}
        </p>
      )}

      {goal?.weekReviewNotes && (
        <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <span className="font-medium">Week review: </span>
          {goal.weekReviewNotes}
        </p>
      )}

      {!editable && goal?.customItems && goal.customItems.length > 0 && (
        <ul className="mt-4 space-y-2">
          {goal.customItems.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={saveGoal} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="targetApplications"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Applications
            </label>
            <input
              id="targetApplications"
              name="targetApplications"
              type="number"
              min={0}
              max={100}
              defaultValue={goal?.targetApplications ?? 5}
              disabled={!editable}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
            />
          </div>
          <div>
            <label
              htmlFor="targetInterviews"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Interviews
            </label>
            <input
              id="targetInterviews"
              name="targetInterviews"
              type="number"
              min={0}
              max={50}
              defaultValue={goal?.targetInterviews ?? 1}
              disabled={!editable}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-700">
            Weekly hours (must total at least {MIN_WEEKLY_HOURS})
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="targetJobSeekingHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Job seeking
              </label>
              <input
                id="targetJobSeekingHours"
                name="targetJobSeekingHours"
                type="number"
                min={0}
                max={168}
                step={0.5}
                defaultValue={
                  goal?.targetJobSeekingHours ??
                  DEFAULT_HOUR_TARGETS.targetJobSeekingHours
                }
                disabled={!editable}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
              />
            </div>
            <div>
              <label
                htmlFor="targetEmploymentHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Employment
              </label>
              <input
                id="targetEmploymentHours"
                name="targetEmploymentHours"
                type="number"
                min={0}
                max={168}
                step={0.5}
                defaultValue={
                  goal?.targetEmploymentHours ??
                  DEFAULT_HOUR_TARGETS.targetEmploymentHours
                }
                disabled={!editable}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
              />
            </div>
            <div>
              <label
                htmlFor="targetEducationHours"
                className="mb-1 block text-sm font-medium text-stone-700"
              >
                Education
              </label>
              <input
                id="targetEducationHours"
                name="targetEducationHours"
                type="number"
                min={0}
                max={168}
                step={0.5}
                defaultValue={
                  goal?.targetEducationHours ??
                  DEFAULT_HOUR_TARGETS.targetEducationHours
                }
                disabled={!editable}
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Job seeking: applications, networking, research. Employment: paid
            work. Education: training, courses, certifications.
          </p>
        </div>

        {editable && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Custom goals
            </label>
            <p className="mb-2 text-xs text-stone-500">
              Add one-time tasks like attending a workshop or visiting a career
              center. Check them off during daily updates.
            </p>
            {customItems.length > 0 && (
              <ul className="mb-3 space-y-2">
                {customItems.map((item, index) => (
                  <li
                    key={item.id ?? `new-${index}`}
                    className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-stone-800">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomItem(index)}
                      className="rounded-lg p-1 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                      aria-label="Remove custom goal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomItem}
                onChange={(e) => setNewCustomItem(e.target.value)}
                placeholder="e.g. Attend resume workshop at workforce center"
                maxLength={200}
                className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-3 text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomItem();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={newCustomItem.trim().length < 3 || customItems.length >= 10}
                onClick={addCustomItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium text-stone-700">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={goal?.notes ?? ""}
            disabled={!editable}
            placeholder="e.g. Focus on warehouse and logistics roles in St. Paul"
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isManagerForm && goal?.status === "ACTIVE" && editable && (
          <p className="text-sm text-stone-600">
            Save to update this participant&apos;s active goals for the rest of the
            week. Custom goals with check-in history are kept even if removed from
            this list.
          </p>
        )}

        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save goals"}
            </Button>
            {goal && goal.status === "DRAFT" && (
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={submitForApproval}
              >
                Submit for approval
              </Button>
            )}
          </div>
        )}

        {goal?.status === "PENDING_APPROVAL" && !readOnly && (
          <p className="text-sm text-amber-800">
            Goals submitted — waiting for your manager to approve before you can log daily updates.
          </p>
        )}
      </form>
    </Card>
  );
}
