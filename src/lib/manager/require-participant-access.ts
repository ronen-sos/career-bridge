import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { isSuperAdmin } from "@/lib/roles";
import { resumeRetentionCutoff } from "@/lib/resume/retention";
import { requireRole } from "@/lib/session";

export async function requireParticipantAccess(participantId: string) {
  const session = await requireRole(["MANAGER", "ADMIN"]);

  const participant = await db.user.findUnique({
    where: { id: participantId },
    select: { id: true, role: true, managerId: true, organizationId: true },
  });

  if (!participant || participant.role !== "PARTICIPANT") {
    notFound();
  }

  const isOrgAdmin =
    session.user.role === "ADMIN" &&
    participant.organizationId === session.user.organizationId;
  const isAssignedManager = participant.managerId === session.user.id;

  if (
    !isSuperAdmin(session.user.role) &&
    !isOrgAdmin &&
    !isAssignedManager
  ) {
    notFound();
  }

  return session;
}

export async function getParticipantOverview(participantId: string) {
  return db.user.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      name: true,
      email: true,
      profile: true,
      workExperiences: {
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      },
      education: {
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
      },
      activities: {
        orderBy: { date: "desc" },
      },
      resumeGenerations: {
        where: { createdAt: { gte: resumeRetentionCutoff() } },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });
}
