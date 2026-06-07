"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { WeeklyGoalForm } from "@/components/goals/WeeklyGoalForm";
import { ManagerGoalActions } from "@/components/goals/ManagerGoalActions";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { CustomGoalsProgress } from "@/components/goals/CustomGoalsProgress";
import { computeGoalProgress } from "@/lib/goals/progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";

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
  customItems: Array<{ id: string; label: string; expectedHours: number }>;
  dailyUpdates: Array<{
    id: string;
    date: string;
    applicationsCount: number;
    interviewsCount: number;
    employmentHours: number;
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

type ParticipantQuestion = {
  id: string;
  question: string;
  managerRead: boolean;
  managerReply: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

export function ManagerParticipantGoals({
  participantId,
  participantName,
  goal,
  weekStart,
  weekEnd,
  questions = [],
}: {
  participantId: string;
  participantName: string;
  goal: GoalData | null;
  weekStart: string;
  weekEnd: string;
  questions?: ParticipantQuestion[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activateGoals() {
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

  const unreadQuestions = questions.filter((q) => !q.managerRead).length;

  if (!goal) {
    return (
      <Card>
        <CardTitle>Weekly goals</CardTitle>
        <CardDescription>
          No goals set for this period. Create targets and an end date for{" "}
          {participantName}.
        </CardDescription>
        <div className="mt-4">
          <WeeklyGoalForm
            goal={null}
            weekStart={weekStart}
            weekEnd={weekEnd}
            participantId={participantId}
          />
        </div>
      </Card>
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
        <Card className="border-emerald-200 bg-emerald-50">
          <CardTitle>Activate goals</CardTitle>
          <CardDescription>
            When ready, activate these goals so {participantName} can track
            progress through the end date.
          </CardDescription>
          <Button className="mt-3" disabled={loading} onClick={activateGoals}>
            Activate goals
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadQuestions > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle>
            {unreadQuestions} question{unreadQuestions === 1 ? "" : "s"} awaiting
            response
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
      <ManagerGoalActions
        goal={goal}
        participantName={participantName}
        questions={questions}
      />
    </div>
  );
}
