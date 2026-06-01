import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getParticipantOverview,
} from "@/lib/manager/require-participant-access";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

async function canAccess(participantId: string, userId: string, role: string) {
  const participant = await db.user.findUnique({
    where: { id: participantId },
    select: { role: true, managerId: true },
  });

  if (!participant || participant.role !== "PARTICIPANT") return false;
  if (role === "ADMIN") return true;
  return participant.managerId === userId;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";
  if (!isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const allowed = await canAccess(id, session.user.id, session.user.role);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participant = await getParticipantOverview(id);
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(participant);
}
