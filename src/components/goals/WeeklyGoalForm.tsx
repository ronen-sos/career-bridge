"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  defaultWeekEnd,
  formatWeekRange,
  toDateInputValue,
} from "@/lib/goals/progress";
import { cn } from "@/lib/cn";
import {
  DEFAULT_EMPLOYMENT_HOURS,
} from "@/lib/goals/hours";
import { GoalUnitBudgetGuide } from "@/components/goals/GoalUnitBudgetGuide";

function formatGoalErrors(error: Record<string, string[] | undefined>): string | null {
  for (const messages of Object.values(error)) {
    if (messages?.[0]) return messages[0];
  }
  return null;
}

type CustomItem = {
  id: string;
  label: string;
  expectedHours: number;
};

type CustomItemDraft = {
  id?: string;
  label: string;
  expectedHours: number;
};

type GoalData = {
  id: string;
  weekStart: string;
  weekEnd: string;
  targetApplications: number;
  targetInterviews: number;
  targetEmploymentHours: number;
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
  weekEnd?: string;
  participantId?: string;
  readOnly?: boolean;
};

export function WeeklyGoalForm({
  goal,
  weekStart,
  weekEnd: weekEndProp,
  participantId,
  readOnly = false,
}: WeeklyGoalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState<CustomItemDraft[]>(
    goal?.customItems?.map((item) => ({
      id: item.id,
      label: item.label,
      expectedHours: item.expectedHours,
    })) ?? [],
  );
  const [newCustomItem, setNewCustomItem] = useState("");
  const [newCustomItemHours, setNewCustomItemHours] = useState("1");
  const [budgetPreview, setBudgetPreview] = useState({
    targetApplications: goal?.targetApplications ?? 5,
    targetInterviews: goal?.targetInterviews ?? 1,
    targetEmploymentHours: goal?.targetEmploymentHours ?? DEFAULT_EMPLOYMENT_HOURS,
  });

  const isManagerForm = !!participantId;
  const defaultEnd = toDateInputValue(
    defaultWeekEnd(goal?.weekStart ?? weekStart),
  );
  const [weekEnd, setWeekEnd] = useState(
    goal?.weekEnd
      ? toDateInputValue(goal.weekEnd)
      : weekEndProp ?? defaultEnd,
  );

  const editable =
    isManagerForm &&
    !readOnly &&
    (!goal ||
      goal.status === "DRAFT" ||
      goal.status === "PENDING_APPROVAL" ||
      goal.status === "ACTIVE");

  function addCustomItem() {
    const label = newCustomItem.trim();
    const hours = Number(newCustomItemHours);
    if (label.length < 3 || customItems.length >= 10) return;
    if (!Number.isFinite(hours) || hours < 0.5) return;

    setCustomItems((prev) => [...prev, { label, expectedHours: hours }]);
    setNewCustomItem("");
    setNewCustomItemHours("1");
  }

  function removeCustomItem(index: number) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveGoal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!participantId) return;

    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      weekStart,
      weekEnd,
      participantId,
      targetApplications: form.get("targetApplications"),
      targetInterviews: form.get("targetInterviews"),
      targetEmploymentHours: form.get("targetEmploymentHours"),
      notes: form.get("notes") || undefined,
      customItems,
    };

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fieldError =
        typeof data.error === "object" && data.error !== null
          ? formatGoalErrors(data.error as Record<string, string[] | undefined>)
          : null;
      setError(
        fieldError ??
          (typeof data.error === "string"
            ? data.error
            : "Could not save goals."),
      );
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  const periodLabel = goal
    ? formatWeekRange(goal.weekStart, goal.weekEnd)
    : formatWeekRange(weekStart, weekEnd);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Weekly goals</CardTitle>
          <CardDescription>
            {isManagerForm
              ? "Set targets and an end date for this goal period."
              : `Your program manager sets these targets. Check in daily once goals are active.`}
          </CardDescription>
          <p className="mt-1 text-sm font-medium text-emerald-800">{periodLabel}</p>
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
              <span className="mt-0.5 block text-xs text-stone-500">
                {item.expectedHours} hr{item.expectedHours === 1 ? "" : "s"} expected
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={saveGoal} className="mt-4 space-y-4">
        {editable && (
          <div>
            <label
              htmlFor="weekEnd"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              End date
            </label>
            <input
              id="weekEnd"
              name="weekEnd"
              type="date"
              value={weekEnd}
              min={weekStart}
              onChange={(e) => setWeekEnd(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base sm:max-w-xs"
            />
          </div>
        )}

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
              onInput={(e) =>
                setBudgetPreview((prev) => ({
                  ...prev,
                  targetApplications:
                    Number((e.target as HTMLInputElement).value) || 0,
                }))
              }
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
              onInput={(e) =>
                setBudgetPreview((prev) => ({
                  ...prev,
                  targetInterviews:
                    Number((e.target as HTMLInputElement).value) || 0,
                }))
              }
              className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="targetEmploymentHours"
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Employment hours
          </label>
          <input
            id="targetEmploymentHours"
            name="targetEmploymentHours"
            type="number"
            min={0}
            max={168}
            step={0.5}
            defaultValue={
              goal?.targetEmploymentHours ?? DEFAULT_EMPLOYMENT_HOURS
            }
            disabled={!editable}
            required
            onInput={(e) =>
              setBudgetPreview((prev) => ({
                ...prev,
                targetEmploymentHours:
                  Number((e.target as HTMLInputElement).value) || 0,
              }))
            }
            className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base disabled:bg-stone-50 sm:max-w-xs"
          />
          <p className="mt-1 text-xs text-stone-500">
            Paid work hours for the week. Each hour counts as 1 progress unit.
          </p>
        </div>

        {editable && (
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Custom goals
            </label>
            <p className="mb-2 text-xs text-stone-500">
              Add one-time tasks like workshops or career center visits. Enter
              how many hours you expect each to take — that time is added to the
              weekly budget alongside applications, interviews, and employment
              hours.
            </p>
            {customItems.length > 0 && (
              <ul className="mb-3 space-y-2">
                {customItems.map((item, index) => (
                  <li
                    key={item.id ?? `new-${index}`}
                    className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-stone-800">
                      {item.label}
                      <span className="mt-0.5 block text-xs text-stone-500">
                        {item.expectedHours} hr{item.expectedHours === 1 ? "" : "s"} expected
                      </span>
                    </span>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
              <div className="sm:w-28">
                <label htmlFor="newCustomItemHours" className="mb-1 block text-xs font-medium text-stone-600 sm:sr-only">
                  Expected hours
                </label>
                <input
                  id="newCustomItemHours"
                  type="number"
                  min={0.5}
                  max={168}
                  step={0.5}
                  value={newCustomItemHours}
                  onChange={(e) => setNewCustomItemHours(e.target.value)}
                  aria-label="Expected hours for custom goal"
                  className="w-full rounded-xl border border-stone-300 px-3 py-3 text-base"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  newCustomItem.trim().length < 3 ||
                  customItems.length >= 10 ||
                  Number(newCustomItemHours) < 0.5
                }
                onClick={addCustomItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Expected hours (e.g. 8 for a full-day workshop).
            </p>
          </div>
        )}

        {editable && isManagerForm && (
          <GoalUnitBudgetGuide
            targetApplications={budgetPreview.targetApplications}
            targetInterviews={budgetPreview.targetInterviews}
            targetEmploymentHours={budgetPreview.targetEmploymentHours}
            customGoals={customItems.map((item) => ({
              label: item.label,
              expectedHours: item.expectedHours,
            }))}
          />
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
            period. Custom goals with check-in history are kept even if removed from
            this list.
          </p>
        )}

        {editable && (
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save goals"}
            </Button>
          </div>
        )}

        {!goal && !isManagerForm && (
          <p className="text-sm text-stone-600">
            Your program manager has not set goals for this period yet.
          </p>
        )}

        {goal?.status === "DRAFT" && !isManagerForm && (
          <p className="text-sm text-amber-800">
            Goals are set — waiting for your program manager to activate them before
            you can log daily updates.
          </p>
        )}
      </form>
    </Card>
  );
}
