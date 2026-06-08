import { db } from "@/lib/db";
import { findParticipantCurrentGoal } from "@/lib/goals/access";
import { periodBounds } from "@/lib/goals/dates";
import { isDateInWeek } from "@/lib/goals/progress";
import {
  resolveCompany,
  resolvePosition,
} from "@/lib/applications/catalog.server";

export async function countApplicationsInPeriod(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
) {
  const { start, end } = periodBounds(weekStart, weekEnd);

  return db.jobApplication.count({
    where: {
      userId,
      appliedAt: { gte: start, lte: end },
    },
  });
}

async function syncDailyApplicationCount(
  userId: string,
  appliedAt: Date,
  applicationCount: number,
) {
  const goal = await findParticipantCurrentGoal(userId);
  if (!goal || goal.status !== "ACTIVE") return;
  if (!isDateInWeek(appliedAt, goal.weekStart, goal.weekEnd)) return;

  const dateOnly = new Date(appliedAt);
  dateOnly.setHours(0, 0, 0, 0);

  const existing = await db.goalDailyUpdate.findUnique({
    where: {
      weeklyGoalId_date: {
        weeklyGoalId: goal.id,
        date: dateOnly,
      },
    },
  });

  if (existing) {
    if (existing.applicationsCount >= applicationCount) return;

    await db.goalDailyUpdate.update({
      where: { id: existing.id },
      data: {
        applicationsCount: applicationCount,
        managerReviewed: false,
        managerReviewedAt: null,
      },
    });
    return;
  }

  await db.goalDailyUpdate.create({
    data: {
      weeklyGoalId: goal.id,
      date: dateOnly,
      applicationsCount: applicationCount,
      notes: "Application logged from job search activity.",
    },
  });
}

export async function recordJobApplication(input: {
  userId: string;
  appliedAt: Date;
  companyId?: string;
  companyName?: string;
  allowSimilarCompanyOverride?: boolean;
  positionId?: string;
  positionTitle?: string;
  resumeGenerationId?: string;
  description?: string;
  hoursSpent?: number;
}) {
  const company = await resolveCompany({
    companyId: input.companyId,
    companyName: input.companyName,
    allowSimilarOverride: input.allowSimilarCompanyOverride,
  });

  const position = await resolvePosition({
    companyId: company.id,
    positionId: input.positionId,
    positionTitle: input.positionTitle,
  });

  if (input.resumeGenerationId) {
    const resume = await db.resumeGeneration.findFirst({
      where: { id: input.resumeGenerationId, userId: input.userId },
      select: { id: true },
    });
    if (!resume) {
      throw new Error("Resume not found.");
    }

    const linked = await db.jobApplication.findUnique({
      where: { resumeGenerationId: input.resumeGenerationId },
    });
    if (linked) {
      return db.jobApplication.findUniqueOrThrow({
        where: { id: linked.id },
        include: {
          company: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
      });
    }
  }

  const appliedAt = new Date(input.appliedAt);
  appliedAt.setHours(0, 0, 0, 0);

  const duplicate = await db.jobApplication.findFirst({
    where: {
      userId: input.userId,
      companyId: company.id,
      positionId: position.id,
      appliedAt,
    },
  });
  if (duplicate) {
    return db.jobApplication.findUniqueOrThrow({
      where: { id: duplicate.id },
      include: {
        company: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });
  }

  const application = await db.jobApplication.create({
    data: {
      userId: input.userId,
      companyId: company.id,
      positionId: position.id,
      resumeGenerationId: input.resumeGenerationId ?? null,
      appliedAt,
    },
    include: {
      company: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
    },
  });

  if (!input.resumeGenerationId) {
    await db.jobSearchActivity.create({
      data: {
        userId: input.userId,
        date: appliedAt,
        type: "APPLICATION",
        description:
          input.description?.trim() ||
          `Applied for ${position.title} at ${company.name}`,
        company: company.name,
        roleTitle: position.title,
        hoursSpent: input.hoursSpent ?? 0,
      },
    });
  }

  const weekCount = await (async () => {
    const goal = await findParticipantCurrentGoal(input.userId);
    if (!goal) return 1;
    return countApplicationsInPeriod(
      input.userId,
      goal.weekStart,
      goal.weekEnd,
    );
  })();

  const todayCount = await db.jobApplication.count({
    where: {
      userId: input.userId,
      appliedAt,
    },
  });

  await syncDailyApplicationCount(input.userId, appliedAt, todayCount);

  return { ...application, weekCount };
}

export async function listRecentApplications(userId: string, limit = 5) {
  return db.jobApplication.findMany({
    where: { userId },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      company: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
    },
  });
}

export async function listResumeHistory(
  userId: string,
  positionId: string,
) {
  return db.resumeGeneration.findMany({
    where: {
      userId,
      positionId,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetRole: true,
      targetCompany: true,
      createdAt: true,
      application: { select: { id: true, appliedAt: true } },
    },
  });
}
