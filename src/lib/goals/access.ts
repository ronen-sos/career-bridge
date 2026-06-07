import { getWeekStart } from "@/lib/format";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  currentGoalPeriodFilter,
  defaultWeekEnd,
  nextGoalPeriodEnd,
  nextGoalPeriodStart,
} from "@/lib/goals/progress";

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

type GoalWithRelations = Prisma.WeeklyGoalGetPayload<{
  include: typeof goalInclude;
}>;

export async function findCurrentGoalForUser(userId: string) {
  return db.weeklyGoal.findFirst({
    where: {
      userId,
      status: { not: "COMPLETED" },
      ...currentGoalPeriodFilter(),
    },
    orderBy: { weekStart: "desc" },
    include: goalInclude,
  });
}

export type ManagerGoalContext = {
  goal: GoalWithRelations | null;
  completedGoal: GoalWithRelations | null;
  periodWeekStart: Date;
  periodWeekEnd: Date;
};

export async function findManagerGoalContext(
  userId: string,
): Promise<ManagerGoalContext> {
  const goal = await findCurrentGoalForUser(userId);

  if (goal) {
    return {
      goal,
      completedGoal: null,
      periodWeekStart: goal.weekStart,
      periodWeekEnd: goal.weekEnd,
    };
  }

  const latestCompleted = await db.weeklyGoal.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { weekEnd: "desc" },
    include: goalInclude,
  });

  if (latestCompleted) {
    const periodWeekStart = nextGoalPeriodStart(latestCompleted.weekEnd);
    const periodWeekEnd = nextGoalPeriodEnd(latestCompleted.weekEnd);

    const nextGoal = await db.weeklyGoal.findUnique({
      where: {
        userId_weekStart: { userId, weekStart: periodWeekStart },
      },
      include: goalInclude,
    });

    if (nextGoal && nextGoal.status !== "COMPLETED") {
      return {
        goal: nextGoal,
        completedGoal: latestCompleted,
        periodWeekStart: nextGoal.weekStart,
        periodWeekEnd: nextGoal.weekEnd,
      };
    }

    return {
      goal: null,
      completedGoal: latestCompleted,
      periodWeekStart,
      periodWeekEnd,
    };
  }

  const weekStart = getWeekStart();
  return {
    goal: null,
    completedGoal: null,
    periodWeekStart: weekStart,
    periodWeekEnd: defaultWeekEnd(weekStart),
  };
}
