import { notFound } from "next/navigation";

import { ParticipantOverview } from "@/components/manager/ParticipantOverview";
import { ManagerParticipantGoals } from "@/components/manager/ManagerParticipantGoals";
import { Card, CardTitle } from "@/components/ui/Card";
import { getWeekStart } from "@/lib/format";
import { findCurrentGoalForUser } from "@/lib/goals/access";
import { defaultWeekEnd, formatWeekRange, toDateInputValue } from "@/lib/goals/progress";
import { listQuestionsForParticipant } from "@/lib/questions/record.server";
import {
  getParticipantOverview,
  requireParticipantAccess,
} from "@/lib/manager/require-participant-access";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerParticipantPage({ params }: PageProps) {
  const { id } = await params;
  await requireParticipantAccess(id);

  const participant = await getParticipantOverview(id);
  if (!participant) notFound();

  const weekStart = getWeekStart();
  const weekEnd = defaultWeekEnd(weekStart);
  const [goal, questions] = await Promise.all([
    findCurrentGoalForUser(id),
    listQuestionsForParticipant(id),
  ]);

  const serializedGoal = goal
    ? {
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
      }
    : null;

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Card className="mb-6">
        <CardTitle>Weekly accountability</CardTitle>
        <p className="mt-1 text-sm text-stone-600">
          {serializedGoal
            ? formatWeekRange(serializedGoal.weekStart, serializedGoal.weekEnd)
            : formatWeekRange(weekStart, weekEnd)}
        </p>
        <div className="mt-4">
          <ManagerParticipantGoals
            participantId={participant.id}
            participantName={participant.name}
            goal={serializedGoal}
            weekStart={toDateInputValue(weekStart)}
            weekEnd={toDateInputValue(weekEnd)}
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
