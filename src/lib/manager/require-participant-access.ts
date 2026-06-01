import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { resumeRetentionCutoff } from "@/lib/resume/retention";
import { requireRole } from "@/lib/session";

export async function requireParticipantAccess(participantId: string) {
  const session = await requireRole(["MANAGER", "ADMIN"]);

  const participant = await db.user.findUnique({
    where: { id: participantId },
    select: { id: true, role: true, managerId: true },
  });

  if (!participant || participant.role !== "PARTICIPANT") {
    notFound();
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAssignedManager = participant.managerId === session.user.id;

  if (!isAdmin && !isAssignedManager) {
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
