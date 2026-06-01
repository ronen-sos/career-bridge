"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { WeeklyGoalForm } from "@/components/goals/WeeklyGoalForm";
import { ManagerGoalActions } from "@/components/goals/GoalsViews";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { CustomGoalsProgress } from "@/components/goals/CustomGoalsProgress";
import { computeGoalProgress } from "@/lib/goals/progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";

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

export function ManagerParticipantGoals({
  participantId,
  participantName,
  goal,
  weekStart,
}: {
  participantId: string;
  participantName: string;
  goal: GoalData | null;
  weekStart: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approveDraft() {
    if (!goal) return;
    setLoading(true);
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    router.refresh();
    setLoading(false);
  }

  const progress = goal
    ? computeGoalProgress(goal, goal.dailyUpdates)
    : null;

  const customProgress = goal
    ? computeCustomGoalProgress(goal.customItems, goal.dailyUpdates)
    : [];

  const unreviewed = goal?.dailyUpdates.filter((u) => !u.managerReviewed).length ?? 0;

  if (!goal) {
    return (
      <Card>
        <CardTitle>Weekly goals</CardTitle>
        <CardDescription>
          No goals set for this week. Create targets for {participantName}.
        </CardDescription>
        <div className="mt-4">
          <WeeklyGoalForm
            goal={null}
            weekStart={weekStart}
            participantId={participantId}
          />
        </div>
      </Card>
    );
  }

  if (goal.status === "DRAFT" && goal.createdBy.role !== "PARTICIPANT") {
    return (
      <div className="space-y-4">
        <WeeklyGoalForm
          goal={goal}
          weekStart={weekStart}
          participantId={participantId}
        />
        <Card className="border-emerald-200 bg-emerald-50">
          <CardTitle>Activate goals</CardTitle>
          <CardDescription>
            When ready, approve these goals so {participantName} can begin daily
            check-ins.
          </CardDescription>
          <Button className="mt-3" disabled={loading} onClick={approveDraft}>
            Approve & activate
          </Button>
        </Card>
      </div>
    );
  }

  if (goal.status === "DRAFT" || goal.status === "PENDING_APPROVAL") {
    return (
      <div className="space-y-4">
        <WeeklyGoalForm
          goal={goal}
          weekStart={weekStart}
          participantId={participantId}
        />
        {goal.status === "PENDING_APPROVAL" && (
          <ManagerGoalActions goal={goal} participantName={participantName} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreviewed > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle>
            {unreviewed} daily update{unreviewed === 1 ? "" : "s"} awaiting review
          </CardTitle>
        </Card>
      )}
      <WeeklyGoalForm
        goal={goal}
        weekStart={weekStart}
        participantId={participantId}
      />
      {progress && (
        <GoalProgressSummary stats={progress} status={goal.status} />
      )}
      {customProgress.length > 0 && (
        <CustomGoalsProgress items={customProgress} />
      )}
      <ManagerGoalActions goal={goal} participantName={participantName} />
    </div>
  );
}
