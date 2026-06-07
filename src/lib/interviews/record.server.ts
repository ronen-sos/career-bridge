import { db } from "@/lib/db";
import { findCurrentGoalForUser } from "@/lib/goals/access";
import { isDateInWeek } from "@/lib/goals/progress";
import {
  resolveCompany,
  resolvePosition,
} from "@/lib/applications/catalog.server";
import { recordJobApplication } from "@/lib/applications/record.server";

export async function countInterviewsInPeriod(
  userId: string,
  weekStart: Date,
  weekEnd: Date,
) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(weekEnd);
  end.setHours(23, 59, 59, 999);

  return db.jobInterview.count({
    where: {
      userId,
      interviewedAt: { gte: start, lte: end },
    },
  });
}

async function syncDailyInterviewCount(
  userId: string,
  interviewedAt: Date,
  interviewCount: number,
) {
  const goal = await findCurrentGoalForUser(userId);
  if (!goal || goal.status !== "ACTIVE") return;
  if (!isDateInWeek(interviewedAt, goal.weekStart, goal.weekEnd)) return;

  const dateOnly = new Date(interviewedAt);
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
    if (existing.interviewsCount >= interviewCount) return;

    await db.goalDailyUpdate.update({
      where: { id: existing.id },
      data: {
        interviewsCount: interviewCount,
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
      interviewsCount: interviewCount,
      notes: "Interview logged from job search activity.",
    },
  });
}

export async function listApplicationsForInterviewPicker(userId: string) {
  return db.jobApplication.findMany({
    where: { userId },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
    include: {
      company: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
      interviews: {
        select: { id: true, interviewedAt: true },
        orderBy: { interviewedAt: "desc" },
      },
    },
  });
}

export async function recordJobInterview(input: {
  userId: string;
  interviewedAt: Date;
  linkType: "LINKED_APPLICATION" | "NO_PRIOR_APPLICATION" | "RETROACTIVE_APPLICATION";
  applicationId?: string;
  companyId?: string;
  companyName?: string;
  allowSimilarCompanyOverride?: boolean;
  positionId?: string;
  positionTitle?: string;
  appliedAt?: Date;
  notes?: string;
  hoursSpent?: number;
}) {
  const interviewedAt = new Date(input.interviewedAt);
  interviewedAt.setHours(0, 0, 0, 0);

  let companyId = input.companyId;
  let positionId = input.positionId;
  let applicationId: string | null = input.applicationId ?? null;
  let companyName: string;
  let positionTitle: string;

  if (input.linkType === "LINKED_APPLICATION") {
    if (!input.applicationId) {
      throw new Error("Select an application for this interview.");
    }

    const application = await db.jobApplication.findFirst({
      where: { id: input.applicationId, userId: input.userId },
      include: {
        company: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });

    if (!application) {
      throw new Error("Application not found.");
    }

    companyId = application.companyId;
    positionId = application.positionId;
    companyName = application.company.name;
    positionTitle = application.position.title;
  } else if (input.linkType === "RETROACTIVE_APPLICATION") {
    if (!input.appliedAt) {
      throw new Error("Application date is required.");
    }

    const application = await recordJobApplication({
      userId: input.userId,
      appliedAt: input.appliedAt,
      companyId: input.companyId,
      companyName: input.companyName,
      allowSimilarCompanyOverride: input.allowSimilarCompanyOverride,
      positionId: input.positionId,
      positionTitle: input.positionTitle,
      description: `Retroactive application logged while recording an interview.`,
    });

    applicationId = application.id;
    companyId = application.companyId;
    positionId = application.positionId;
    companyName = application.company.name;
    positionTitle = application.position.title;
  } else {
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

    companyId = company.id;
    positionId = position.id;
    companyName = company.name;
    positionTitle = position.title;
    applicationId = null;
  }

  const duplicate = await db.jobInterview.findFirst({
    where: {
      userId: input.userId,
      companyId: companyId!,
      positionId: positionId!,
      interviewedAt,
    },
  });

  if (duplicate) {
    return db.jobInterview.findUniqueOrThrow({
      where: { id: duplicate.id },
      include: {
        company: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
        application: {
          select: {
            id: true,
            appliedAt: true,
          },
        },
      },
    });
  }

  const interview = await db.jobInterview.create({
    data: {
      userId: input.userId,
      companyId: companyId!,
      positionId: positionId!,
      applicationId,
      interviewedAt,
      linkType: input.linkType,
      notes: input.notes?.trim() || null,
      hoursSpent: input.hoursSpent ?? 0,
    },
    include: {
      company: { select: { id: true, name: true } },
      position: { select: { id: true, title: true } },
      application: {
        select: {
          id: true,
          appliedAt: true,
        },
      },
    },
  });

  await db.jobSearchActivity.create({
    data: {
      userId: input.userId,
      date: interviewedAt,
      type: "INTERVIEW",
      description:
        input.notes?.trim() ||
        `Interview for ${positionTitle} at ${companyName}`,
      company: companyName,
      roleTitle: positionTitle,
      hoursSpent: input.hoursSpent ?? 0,
    },
  });

  const weekInterviewCount = await (async () => {
    const goal = await findCurrentGoalForUser(input.userId);
    if (!goal) return 1;
    return countInterviewsInPeriod(
      input.userId,
      goal.weekStart,
      goal.weekEnd,
    );
  })();

  const dayInterviewCount = await db.jobInterview.count({
    where: {
      userId: input.userId,
      interviewedAt,
    },
  });

  await syncDailyInterviewCount(
    input.userId,
    interviewedAt,
    dayInterviewCount,
  );

  return { ...interview, weekInterviewCount };
}

export type EmployerStatRow = {
  companyId: string;
  companyName: string;
  applications: number;
  interviews: number;
  linkedInterviews: number;
  noApplicationInterviews: number;
  followThroughRate: number | null;
  positions: Array<{
    positionId: string;
    positionTitle: string;
    applications: number;
    interviews: number;
    followThroughRate: number | null;
  }>;
};

export async function getEmployerInterviewStats(): Promise<EmployerStatRow[]> {
  const companies = await db.companyCatalog.findMany({
    orderBy: { name: "asc" },
    include: {
      positions: {
        orderBy: { title: "asc" },
        select: { id: true, title: true },
      },
    },
  });

  const [applicationCounts, interviewCounts, linkedInterviewCounts, noAppCounts] =
    await Promise.all([
      db.jobApplication.groupBy({
        by: ["companyId", "positionId"],
        _count: { _all: true },
      }),
      db.jobInterview.groupBy({
        by: ["companyId", "positionId"],
        _count: { _all: true },
      }),
      db.jobInterview.groupBy({
        by: ["companyId", "positionId"],
        where: { applicationId: { not: null } },
        _count: { _all: true },
      }),
      db.jobInterview.groupBy({
        by: ["companyId"],
        where: { linkType: "NO_PRIOR_APPLICATION" },
        _count: { _all: true },
      }),
    ]);

  const appMap = new Map(
    applicationCounts.map((row) => [
      `${row.companyId}:${row.positionId}`,
      row._count._all,
    ]),
  );
  const interviewMap = new Map(
    interviewCounts.map((row) => [
      `${row.companyId}:${row.positionId}`,
      row._count._all,
    ]),
  );
  const linkedMap = new Map(
    linkedInterviewCounts.map((row) => [
      `${row.companyId}:${row.positionId}`,
      row._count._all,
    ]),
  );
  const noAppMap = new Map(
    noAppCounts.map((row) => [row.companyId, row._count._all]),
  );

  return companies
    .map((company) => {
      const positions = company.positions.map((position) => {
        const key = `${company.id}:${position.id}`;
        const applications = appMap.get(key) ?? 0;
        const interviews = interviewMap.get(key) ?? 0;
        return {
          positionId: position.id,
          positionTitle: position.title,
          applications,
          interviews,
          followThroughRate:
            applications > 0
              ? Math.round((interviews / applications) * 100)
              : null,
        };
      });

      const applications = positions.reduce((sum, p) => sum + p.applications, 0);
      const interviews = positions.reduce((sum, p) => sum + p.interviews, 0);
      const linkedInterviews = positions.reduce(
        (sum, position) =>
          sum + (linkedMap.get(`${company.id}:${position.positionId}`) ?? 0),
        0,
      );

      return {
        companyId: company.id,
        companyName: company.name,
        applications,
        interviews,
        linkedInterviews,
        noApplicationInterviews: noAppMap.get(company.id) ?? 0,
        followThroughRate:
          applications > 0
            ? Math.round((linkedInterviews / applications) * 100)
            : null,
        positions: positions.filter(
          (position) => position.applications > 0 || position.interviews > 0,
        ),
      };
    })
    .filter(
      (row) =>
        row.applications > 0 ||
        row.interviews > 0 ||
        row.noApplicationInterviews > 0,
    )
    .sort((a, b) => b.interviews - a.interviews || b.applications - a.applications);
}
