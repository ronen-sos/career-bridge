import { db } from "@/lib/db";

export const activityFeedInclude = {
  resumeGeneration: {
    select: {
      id: true,
      positionId: true,
      application: {
        select: {
          id: true,
          appliedAt: true,
        },
      },
      position: {
        select: {
          id: true,
          title: true,
          companyId: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} as const;

export async function logResumeBuiltActivity(input: {
  userId: string;
  resumeGenerationId: string;
  companyName: string;
  positionTitle: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return db.jobSearchActivity.create({
    data: {
      userId: input.userId,
      date: today,
      type: "RESUME",
      description: `Built tailored resume for ${input.positionTitle} at ${input.companyName}`,
      company: input.companyName,
      roleTitle: input.positionTitle,
      hoursSpent: 0,
      resumeGenerationId: input.resumeGenerationId,
    },
  });
}

type ActivityWithResume = {
  id: string;
  date: Date;
  type: string;
  description: string;
  company: string | null;
  roleTitle: string | null;
  hoursSpent: number;
  managerReviewed: boolean;
  managerNotes: string | null;
  resumeGenerationId: string | null;
  resumeGeneration: {
    id: string;
    positionId: string | null;
    application: { id: string; appliedAt: Date } | null;
    position: {
      id: string;
      title: string;
      companyId: string;
      company: { id: string; name: string };
    } | null;
  } | null;
};

export function serializeActivityForFeed(activity: ActivityWithResume) {
  const position = activity.resumeGeneration?.position;

  return {
    id: activity.id,
    date: activity.date.toISOString(),
    type: activity.type,
    description: activity.description,
    company: activity.company,
    roleTitle: activity.roleTitle,
    hoursSpent: activity.hoursSpent,
    managerReviewed: activity.managerReviewed,
    managerNotes: activity.managerNotes,
    resumeGenerationId: activity.resumeGenerationId,
    applicationRecorded: Boolean(activity.resumeGeneration?.application),
    appliedAt:
      activity.resumeGeneration?.application?.appliedAt.toISOString() ?? null,
    companyId: position?.companyId ?? null,
    positionId: position?.id ?? activity.resumeGeneration?.positionId ?? null,
    companyName: position?.company.name ?? activity.company,
    positionTitle: position?.title ?? activity.roleTitle,
  };
}

export function serializeActivitiesForFeed(activities: ActivityWithResume[]) {
  return activities.map(serializeActivityForFeed);
}
