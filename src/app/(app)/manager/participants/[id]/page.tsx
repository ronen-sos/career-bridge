import { notFound } from "next/navigation";

import { ParticipantOverview } from "@/components/manager/ParticipantOverview";
import { ManagerParticipantGoals } from "@/components/manager/ManagerParticipantGoals";
import { Card, CardTitle } from "@/components/ui/Card";
import { findManagerGoalContext, goalInclude } from "@/lib/goals/access";
import { formatWeekRange, toDateInputValue } from "@/lib/goals/progress";
import type { Prisma } from "@/generated/prisma/client";
import { listQuestionsForParticipant } from "@/lib/questions/record.server";
import {
  getParticipantOverview,
  requireParticipantAccess,
} from "@/lib/manager/require-participant-access";

type PageProps = {
  params: Promise<{ id: string }>;
};

type GoalRecord = Prisma.WeeklyGoalGetPayload<{
  include: typeof goalInclude;
}>;

function serializeGoal(goal: GoalRecord) {
  return {
    ...goal,
    weekStart: goal.weekStart.toISOString(),
    weekEnd: goal.weekEnd.toISOString(),
    dailyUpdates: goal.dailyUpdates.map((u) => ({
      ...u,
      date: u.date.toISOString(),
      customCompletions: u.customCompletions.map((c) => ({
        customItemId: c.customItemId,
        completed: c.completed,
        customItem: c.customItem,
      })),
    })),
  };
}

export default async function ManagerParticipantPage({ params }: PageProps) {
  const { id } = await params;
  await requireParticipantAccess(id);

  const participant = await getParticipantOverview(id);
  if (!participant) notFound();

  const [goalContext, questions] = await Promise.all([
    findManagerGoalContext(id),
    listQuestionsForParticipant(id),
  ]);

  const serializedGoal = goalContext.goal
    ? serializeGoal(goalContext.goal)
    : null;
  const serializedCompletedGoal = goalContext.completedGoal
    ? serializeGoal(goalContext.completedGoal)
    : null;

  const headerRange = serializedGoal
    ? formatWeekRange(serializedGoal.weekStart, serializedGoal.weekEnd)
    : serializedCompletedGoal && !serializedGoal
      ? `Next: ${formatWeekRange(
          goalContext.periodWeekStart,
          goalContext.periodWeekEnd,
        )}`
      : formatWeekRange(
          goalContext.periodWeekStart,
          goalContext.periodWeekEnd,
        );

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Card className="mb-6">
        <CardTitle>Weekly accountability</CardTitle>
        <p className="mt-1 text-sm text-stone-600">{headerRange}</p>
        <div className="mt-4">
          <ManagerParticipantGoals
            participantId={participant.id}
            participantName={participant.name}
            goal={serializedGoal}
            completedGoal={serializedCompletedGoal}
            weekStart={toDateInputValue(goalContext.periodWeekStart)}
            weekEnd={toDateInputValue(goalContext.periodWeekEnd)}
            questions={questions.map((q) => ({
              id: q.id,
              question: q.question,
              managerRead: q.managerRead,
              managerReply: q.managerReply,
              createdAt: q.createdAt.toISOString(),
              user: {
                id: q.user.id,
                name: q.user.name,
                email: q.user.email,
              },
            }))}
          />
        </div>
      </Card>
      <ParticipantOverview participant={participant} />
    </div>
  );
}
