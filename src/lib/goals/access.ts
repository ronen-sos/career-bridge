import { db } from "@/lib/db";
import { currentGoalPeriodFilter } from "@/lib/goals/progress";

export async function canManageParticipantGoals(
  actorId: string,
  actorRole: string,
  participantId: string,
): Promise<boolean> {
  if (actorRole === "ADMIN") return true;

  if (actorRole !== "MANAGER") return false;

  const participant = await db.user.findUnique({
    where: { id: participantId },
    select: { role: true, managerId: true },
  });

  return (
    participant?.role === "PARTICIPANT" && participant.managerId === actorId
  );
}

export async function requireGoalAccess(
  goalId: string,
  actorId: string,
  actorRole: string,
) {
  const goal = await db.weeklyGoal.findUnique({
    where: { id: goalId },
    select: { userId: true },
  });

  if (!goal) return null;

  if (actorRole === "PARTICIPANT" && goal.userId === actorId) {
    return goal;
  }

  const canManage = await canManageParticipantGoals(
    actorId,
    actorRole,
    goal.userId,
  );
  return canManage ? goal : null;
}

export const goalInclude = {
  customItems: { orderBy: { sortOrder: "asc" as const } },
  dailyUpdates: {
    orderBy: { date: "desc" as const },
    include: {
      customCompletions: {
        include: { customItem: { select: { id: true, label: true } } },
      },
    },
  },
  createdBy: { select: { id: true, name: true, role: true } },
  managerApprovedBy: { select: { id: true, name: true } },
  weekReviewedBy: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true } },
};

export async function findCurrentGoalForUser(userId: string) {
  return db.weeklyGoal.findFirst({
    where: {
      userId,
      ...currentGoalPeriodFilter(),
    },
    orderBy: { weekStart: "desc" },
    include: goalInclude,
  });
}
