import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canManageParticipantGoals,
  findManagerGoalContext,
  findParticipantCurrentGoal,
  goalInclude,
} from "@/lib/goals/access";
import { parseCalendarDate } from "@/lib/goals/dates";
import { weeklyGoalSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const participantIdParam = searchParams.get("participantId");

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";

  if (participantIdParam && isManager) {
    const allowed = await canManageParticipantGoals(
      session.user.id,
      session.user.role,
      participantIdParam,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const goal = await findParticipantCurrentGoal(participantIdParam);
    return NextResponse.json(goal);
  }

  if (session.user.role === "PARTICIPANT") {
    const goal = await findParticipantCurrentGoal(session.user.id);
    return NextResponse.json(goal);
  }

  if (isManager) {
    const participantFilter =
      session.user.role === "MANAGER"
        ? { role: "PARTICIPANT" as const, managerId: session.user.id }
        : { role: "PARTICIPANT" as const };

    const participants = await db.user.findMany({
      where: participantFilter,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    const withGoals = await Promise.all(
      participants.map(async (p) => {
        const context = await findManagerGoalContext(p.id);
        return {
          ...p,
          goal: context.goal,
          needsNextPeriod: !context.goal && !!context.completedGoal,
        };
      }),
    );

    return NextResponse.json(withGoals);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";

  if (!isManager) {
    return NextResponse.json(
      { error: "Only program managers can set goals" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const parsed = weeklyGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const allowed = await canManageParticipantGoals(
    session.user.id,
    session.user.role,
    parsed.data.participantId,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const participantId = parsed.data.participantId;
  const weekStart = parseCalendarDate(parsed.data.weekStart);
  const weekEnd = parseCalendarDate(parsed.data.weekEnd);

  const existing = await db.weeklyGoal.findUnique({
    where: {
      userId_weekStart: { userId: participantId, weekStart },
    },
  });

  if (existing?.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Completed goal periods can no longer be edited." },
      { status: 409 },
    );
  }

  const goal = await db.weeklyGoal.upsert({
    where: {
      userId_weekStart: { userId: participantId, weekStart },
    },
    update: {
      weekEnd,
      targetApplications: parsed.data.targetApplications,
      targetInterviews: parsed.data.targetInterviews,
      targetEmploymentHours: parsed.data.targetEmploymentHours,
      notes: parsed.data.notes || null,
    },
    create: {
      userId: participantId,
      weekStart,
      weekEnd,
      targetApplications: parsed.data.targetApplications,
      targetInterviews: parsed.data.targetInterviews,
      targetEmploymentHours: parsed.data.targetEmploymentHours,
      notes: parsed.data.notes || null,
      createdById: session.user.id,
      status: "DRAFT",
    },
  });

  const { syncCustomGoalItems } = await import("@/lib/goals/custom-items.server");
  await syncCustomGoalItems(goal.id, parsed.data.customItems ?? [], {
    merge: existing?.status === "ACTIVE",
  });

  const fullGoal = await db.weeklyGoal.findUnique({
    where: { id: goal.id },
    include: goalInclude,
  });

  return NextResponse.json(fullGoal, { status: existing ? 200 : 201 });
}
