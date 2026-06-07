"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { WeeklyGoalForm } from "@/components/goals/WeeklyGoalForm";
import { ManagerGoalActions } from "@/components/goals/ManagerGoalActions";
import { ManagerQuestionList } from "@/components/goals/AskManagerPanel";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { CustomGoalsProgress } from "@/components/goals/CustomGoalsProgress";
import {
  computeGoalProgress,
  formatWeekRange,
  GOAL_STATUS_COLORS,
  GOAL_STATUS_LABELS,
} from "@/lib/goals/progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";
import { cn } from "@/lib/cn";

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

function CompletedWeekCard({
  goal,
  participantName,
}: {
  goal: GoalData;
  participantName: string;
}) {
  const progress = computeGoalProgress(goal, goal.dailyUpdates);
  const customProgress = computeCustomGoalProgress(
    goal.customItems,
    goal.dailyUpdates,
  );

  return (
    <Card className="border-blue-200 bg-blue-50/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Completed period</CardTitle>
          <CardDescription>
            {participantName}&apos;s goals for{" "}
            {formatWeekRange(goal.weekStart, goal.weekEnd)}
          </CardDescription>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            GOAL_STATUS_COLORS.COMPLETED,
          )}
        >
          {GOAL_STATUS_LABELS.COMPLETED}
        </span>
      </div>
      {goal.weekReviewNotes && (
        <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-blue-900">
          <span className="font-medium">Week review: </span>
          {goal.weekReviewNotes}
        </p>
      )}
      <div className="mt-4 space-y-4">
        <GoalProgressSummary stats={progress} status={goal.status} />
        {customProgress.length > 0 && (
          <CustomGoalsProgress items={customProgress} />
        )}
      </div>
    </Card>
  );
}

function ManagerQuestionsCard({
  participantName,
  questions,
}: {
  participantName: string;
  questions: ParticipantQuestion[];
}) {
  const unreadQuestions = questions.filter((q) => !q.managerRead).length;

  return (
    <Card>
      <CardTitle>
        Questions from {participantName}
        {unreadQuestions > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {unreadQuestions} new
          </span>
        )}
      </CardTitle>
      <CardDescription>
        Optional messages sent through Career Bridge. Replies appear on the
        participant&apos;s home page.
      </CardDescription>
      <div className="mt-4">
        <ManagerQuestionList questions={questions} showParticipant={false} />
      </div>
    </Card>
  );
}

export function ManagerParticipantGoals({
  participantId,
  participantName,
  goal,
  completedGoal,
  weekStart,
  weekEnd,
  questions = [],
}: {
  participantId: string;
  participantName: string;
  goal: GoalData | null;
  completedGoal?: GoalData | null;
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

  const progress = goal ? computeGoalProgress(goal, goal.dailyUpdates) : null;

  const customProgress = goal
    ? computeCustomGoalProgress(goal.customItems, goal.dailyUpdates)
    : [];

  const unreadQuestions = questions.filter((q) => !q.managerRead).length;

  if (!goal && !completedGoal) {
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

  if (!goal && completedGoal) {
    return (
      <div className="space-y-4">
        <CompletedWeekCard goal={completedGoal} participantName={participantName} />
        <Card className="border-emerald-200">
          <CardTitle>Set up next period</CardTitle>
          <CardDescription>
            Create goals for {formatWeekRange(weekStart, weekEnd)}. You can
            adjust the end date before activating.
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
        <ManagerQuestionsCard
          participantName={participantName}
          questions={questions}
        />
      </div>
    );
  }

  if (!goal) {
    return null;
  }

  if (goal.status === "DRAFT" || goal.status === "PENDING_APPROVAL") {
    return (
      <div className="space-y-4">
        {completedGoal && (
          <CompletedWeekCard
            goal={completedGoal}
            participantName={participantName}
          />
        )}
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
        {completedGoal && (
          <ManagerQuestionsCard
            participantName={participantName}
            questions={questions}
          />
        )}
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
