import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  getParticipantOverview,
} from "@/lib/manager/require-participant-access";
import { db } from "@/lib/db";
import { isManagerRole, isSuperAdmin } from "@/lib/roles";

type RouteContext = { params: Promise<{ id: string }> };

async function canAccess(
  participantId: string,
  user: { id: string; role: string; organizationId: string | null },
) {
  const participant = await db.user.findUnique({
    where: { id: participantId },
    select: { role: true, managerId: true, organizationId: true },
  });

  if (!participant || participant.role !== "PARTICIPANT") return false;
  if (isSuperAdmin(user.role)) return true;
  if (user.role === "ADMIN") {
    return participant.organizationId === user.organizationId;
  }
  return participant.managerId === user.id;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isManagerRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const allowed = await canAccess(id, session.user);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participant = await getParticipantOverview(id);
  if (!participant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(participant);
}
