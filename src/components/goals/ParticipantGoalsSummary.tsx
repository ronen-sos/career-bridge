import { formatDate } from "@/lib/format";
import { ProgressRing } from "@/components/goals/GoalProgressSummary";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import {
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
  formatWeekRange,
  isDateInWeek,
} from "@/lib/goals/progress";
import type { GoalProgress } from "@/lib/goals/progress";
import type { CustomGoalProgress } from "@/lib/goals/custom-items";
import { cn } from "@/lib/cn";

type ParticipantGoalsSummaryProps = {
  weekStart: string;
  weekEnd: string;
  status: string;
  progress: GoalProgress;
  customItems: CustomGoalProgress[];
  managerApprovalNotes?: string | null;
  managerNotes?: string | null;
  weekReviewNotes?: string | null;
};

export function ParticipantGoalsSummary({
  weekStart,
  weekEnd,
  status,
  progress,
  customItems,
  managerApprovalNotes,
  managerNotes,
  weekReviewNotes,
}: ParticipantGoalsSummaryProps) {
  const customCompleted = customItems.filter((item) => item.completed).length;
  const periodStarted = isDateInWeek(new Date(), weekStart, weekEnd);
  const periodUpcoming = status === "ACTIVE" && !periodStarted;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Your goals this week</CardTitle>
          <CardDescription>{formatWeekRange(weekStart, weekEnd)}</CardDescription>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            GOAL_STATUS_COLORS[status] ?? GOAL_STATUS_COLORS.DRAFT,
          )}
        >
          {GOAL_STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-stone-100 pt-4 md:gap-6">
        <ProgressRing
          label="Applications"
          current={progress.applications}
          target={progress.targetApplications}
        />
        <ProgressRing
          label="Interviews"
          current={progress.interviews}
          target={progress.targetInterviews}
        />
        <ProgressRing
          label="Employment hrs"
          current={progress.employmentHours}
          target={progress.targetEmploymentHours}
          sublabel={`${progress.employmentHours}/${progress.targetEmploymentHours} hrs`}
        />
      </div>

      {customItems.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-stone-800">Also this week</p>
            <p className="text-xs font-medium text-stone-600">
              {customCompleted} of {customItems.length} done
            </p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {customItems.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-stone-700">
                  {item.label}
                  <span className="mt-0.5 block text-xs text-stone-500">
                    {item.expectedHours} hr{item.expectedHours === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-medium",
                    item.completed ? "text-emerald-800" : "text-stone-500",
                  )}
                >
                  {item.completed ? "Done" : "Not yet"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {managerApprovalNotes && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <span className="font-medium">From your manager: </span>
          {managerApprovalNotes}
        </p>
      )}

      {managerNotes && (
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-800">
          <span className="font-medium">Note: </span>
          {managerNotes}
        </p>
      )}

      {weekReviewNotes && (
        <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-900">
          <span className="font-medium">Week review: </span>
          {weekReviewNotes}
        </p>
      )}

      {periodUpcoming && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Your manager activated these goals. Progress tracking opens on{" "}
          {formatDate(weekStart)}.
        </p>
      )}

      {status === "DRAFT" && (
        <p className="mt-4 text-sm text-amber-800">
          Your manager has set these goals. Progress tracking opens once they
          activate the week.
        </p>
      )}
    </Card>
  );
}
