"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { CustomGoalsProgress } from "@/components/goals/CustomGoalsProgress";
import { WeeklyGoalForm } from "@/components/goals/WeeklyGoalForm";
import {
  DailyUpdateForm,
  DailyUpdateList,
} from "@/components/goals/DailyUpdatePanel";
import { computeGoalProgress, formatWeekRange } from "@/lib/goals/progress";
import { DEFAULT_HOUR_TARGETS } from "@/lib/goals/hours";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";
import { toDateInputValue } from "@/lib/goals/progress";

type GoalWithUpdates = {
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
  customItems: Array<{ id: string; label: string }>;
  dailyUpdates: Array<{
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
    customCompletions: Array<{
      customItemId: string;
      completed: boolean;
      customItem?: { id: string; label: string };
    }>;
  }>;
};

type ManagerGoalActionsProps = {
  goal: GoalWithUpdates;
  participantName: string;
};

export function ManagerGoalActions({ goal, participantName }: ManagerGoalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [weekReviewNotes, setWeekReviewNotes] = useState("");

  async function runAction(action: string, extra?: Record<string, string | undefined>) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Action failed.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  const unreviewed = goal.dailyUpdates.filter((u) => !u.managerReviewed).length;
  const progress = computeGoalProgress(goal, goal.dailyUpdates);
  const customProgress = computeCustomGoalProgress(
    goal.customItems,
    goal.dailyUpdates,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">
          {participantName}&apos;s weekly goals
        </h2>
        <p className="text-sm text-stone-600">
          {formatWeekRange(goal.weekStart)}
        </p>
      </div>

      <GoalProgressSummary stats={progress} status={goal.status} />
      <CustomGoalsProgress items={customProgress} />

      {goal.status === "PENDING_APPROVAL" && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle>Approve weekly goals</CardTitle>
          <CardDescription>
            Review {participantName}&apos;s proposed targets before they begin
            daily check-ins.
          </CardDescription>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Optional notes or adjustments…"
            rows={2}
            className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <Button
            className="mt-3"
            disabled={loading}
            onClick={() =>
              runAction("approve", {
                managerApprovalNotes: approvalNotes || undefined,
              })
            }
          >
            Approve goals
          </Button>
        </Card>
      )}

      {goal.status === "ACTIVE" && (
        <Card>
          <CardTitle>Close out the week</CardTitle>
          <CardDescription>
            {unreviewed > 0
              ? `${unreviewed} daily update${unreviewed === 1 ? "" : "s"} still need review.`
              : "All daily updates reviewed. Add final week notes to close accountability."}
          </CardDescription>
          <textarea
            value={weekReviewNotes}
            onChange={(e) => setWeekReviewNotes(e.target.value)}
            placeholder="Summarize performance, gaps, and focus for next week…"
            rows={3}
            className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <Button
            className="mt-3"
            variant="secondary"
            disabled={loading || !weekReviewNotes.trim()}
            onClick={() =>
              runAction("complete_week", { weekReviewNotes })
            }
          >
            Complete week
          </Button>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardTitle>Daily updates</CardTitle>
        <DailyUpdateList
          updates={goal.dailyUpdates}
          goalId={goal.id}
          canReview={goal.status === "ACTIVE" || goal.status === "COMPLETED"}
          customItems={goal.customItems}
        />
      </Card>
    </div>
  );
}

export function ParticipantGoalsView({
  goal,
  weekStart,
}: {
  goal: GoalWithUpdates | null;
  weekStart: string;
}) {
  const progress = goal
    ? computeGoalProgress(goal, goal.dailyUpdates)
    : {
        applications: 0,
        interviews: 0,
        jobSeekingHours: 0,
        employmentHours: 0,
        educationHours: 0,
        totalHours: 0,
        targetApplications: 5,
        targetInterviews: 1,
        ...DEFAULT_HOUR_TARGETS,
        targetTotalHours:
          DEFAULT_HOUR_TARGETS.targetJobSeekingHours +
          DEFAULT_HOUR_TARGETS.targetEmploymentHours +
          DEFAULT_HOUR_TARGETS.targetEducationHours,
      };

  const customProgress = goal
    ? computeCustomGoalProgress(goal.customItems, goal.dailyUpdates)
    : [];

  return (
    <div className="space-y-6">
      <WeeklyGoalForm goal={goal} weekStart={weekStart} />

      {goal && (
        <GoalProgressSummary stats={progress} status={goal.status} />
      )}

      {customProgress.length > 0 && (
        <CustomGoalsProgress items={customProgress} />
      )}

      {goal?.status === "ACTIVE" && (
        <DailyUpdateForm
          goalId={goal.id}
          weekStart={toDateInputValue(weekStart)}
          customItems={goal.customItems}
        />
      )}

      {goal && (
        <Card>
          <CardTitle>This week&apos;s check-ins</CardTitle>
          <CardDescription>
            Each update is reviewed by your manager for accountability.
          </CardDescription>
          <div className="mt-4">
            <DailyUpdateList
              updates={goal.dailyUpdates}
              goalId={goal.id}
              customItems={goal.customItems}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
