import { notFound } from "next/navigation";

import { ParticipantOverview } from "@/components/manager/ParticipantOverview";
import { ManagerParticipantGoals } from "@/components/manager/ManagerParticipantGoals";
import { Card, CardTitle } from "@/components/ui/Card";
import { getWeekStart } from "@/lib/format";
import { goalInclude } from "@/lib/goals/access";
import { formatWeekRange } from "@/lib/goals/progress";
import {
  getParticipantOverview,
  requireParticipantAccess,
} from "@/lib/manager/require-participant-access";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerParticipantPage({ params }: PageProps) {
  const { id } = await params;
  await requireParticipantAccess(id);

  const participant = await getParticipantOverview(id);
  if (!participant) notFound();

  const weekStart = getWeekStart();
  const goal = await db.weeklyGoal.findUnique({
    where: {
      userId_weekStart: { userId: id, weekStart },
    },
    include: goalInclude,
  });

  const serializedGoal = goal
    ? {
        ...goal,
        weekStart: goal.weekStart.toISOString(),
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
          {formatWeekRange(weekStart)}
        </p>
        <div className="mt-4">
          <ManagerParticipantGoals
            participantId={participant.id}
            participantName={participant.name}
            goal={serializedGoal}
            weekStart={weekStart.toISOString().split("T")[0]!}
          />
        </div>
      </Card>
      <ParticipantOverview participant={participant} />
    </div>
  );
}
