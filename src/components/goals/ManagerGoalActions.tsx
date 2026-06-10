"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { CustomGoalsProgress } from "@/components/goals/CustomGoalsProgress";
import { ManagerQuestionList } from "@/components/goals/AskManagerPanel";
import { computeGoalProgress, formatWeekRange } from "@/lib/goals/progress";
import { computeCustomGoalProgress } from "@/lib/goals/custom-items";

type GoalWithUpdates = {
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

type ManagerGoalActionsProps = {
  goal: GoalWithUpdates;
  participantName: string;
  questions?: ParticipantQuestion[];
};

export function ManagerGoalActions({
  goal,
  participantName,
  questions = [],
}: ManagerGoalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const unreadQuestions = questions.filter((q) => !q.managerRead).length;
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
          {formatWeekRange(goal.weekStart, goal.weekEnd)}
        </p>
      </div>

      <GoalProgressSummary stats={progress} status={goal.status} />
      <CustomGoalsProgress items={customProgress} />

      {goal.status === "ACTIVE" && (
        <Card>
          <CardTitle>Close out the week</CardTitle>
          <CardDescription>
            Add final week notes to close accountability for this period.
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
        <CardTitle>
          Questions from {participantName}
          {unreadQuestions > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {unreadQuestions} new
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Optional messages sent through Career Path. Replies appear on the
          participant&apos;s home page.
        </CardDescription>
        <div className="mt-4">
          <ManagerQuestionList
            questions={questions}
            showParticipant={false}
          />
        </div>
      </Card>
    </div>
  );
}
