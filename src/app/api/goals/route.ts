import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageParticipantGoals } from "@/lib/goals/access";
import { goalInclude } from "@/lib/goals/access";
import { getWeekStart } from "@/lib/format";
import { weeklyGoalSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("weekStart");
  const participantIdParam = searchParams.get("participantId");

  const weekStart = weekStartParam
    ? new Date(weekStartParam)
    : getWeekStart();

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

    const goal = await db.weeklyGoal.findUnique({
      where: {
        userId_weekStart: {
          userId: participantIdParam,
          weekStart,
        },
      },
      include: goalInclude,
    });

    return NextResponse.json(goal);
  }

  if (session.user.role === "PARTICIPANT") {
    const goal = await db.weeklyGoal.findUnique({
      where: {
        userId_weekStart: {
          userId: session.user.id,
          weekStart,
        },
      },
      include: goalInclude,
    });

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
        weeklyGoals: {
          where: { weekStart },
          include: goalInclude,
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      participants.map((p) => ({
        ...p,
        goal: p.weeklyGoals[0] ?? null,
        weeklyGoals: undefined,
      })),
    );
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = weeklyGoalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";

  let participantId = session.user.id;

  if (parsed.data.participantId) {
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const allowed = await canManageParticipantGoals(
      session.user.id,
      session.user.role,
      parsed.data.participantId,
    );
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    participantId = parsed.data.participantId;
  } else if (session.user.role !== "PARTICIPANT") {
    return NextResponse.json(
      { error: "Managers must specify participantId" },
      { status: 400 },
    );
  }

  const weekStart = new Date(parsed.data.weekStart);

  const existing = await db.weeklyGoal.findUnique({
    where: {
      userId_weekStart: { userId: participantId, weekStart },
    },
  });

  const isManagerEdit =
    isManager && participantId !== session.user.id;

  if (existing?.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Completed weeks can no longer be edited." },
      { status: 409 },
    );
  }

  if (existing && !isManagerEdit && existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Goals for this week can no longer be edited." },
      { status: 409 },
    );
  }

  const goal = await db.weeklyGoal.upsert({
    where: {
      userId_weekStart: { userId: participantId, weekStart },
    },
    update: {
      targetApplications: parsed.data.targetApplications,
      targetInterviews: parsed.data.targetInterviews,
      targetJobSeekingHours: parsed.data.targetJobSeekingHours,
      targetEmploymentHours: parsed.data.targetEmploymentHours,
      targetEducationHours: parsed.data.targetEducationHours,
      notes: parsed.data.notes || null,
    },
    create: {
      userId: participantId,
      weekStart,
      targetApplications: parsed.data.targetApplications,
      targetInterviews: parsed.data.targetInterviews,
      targetJobSeekingHours: parsed.data.targetJobSeekingHours,
      targetEmploymentHours: parsed.data.targetEmploymentHours,
      targetEducationHours: parsed.data.targetEducationHours,
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
