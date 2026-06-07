import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireGoalAccess } from "@/lib/goals/access";
import { syncCustomCompletions } from "@/lib/goals/custom-items.server";
import { isDateInWeek } from "@/lib/goals/progress";
import { customCompletionToggleSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await requireGoalAccess(id, session.user.id, session.user.role);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const goal = await db.weeklyGoal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.user.role !== "PARTICIPANT" || goal.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (goal.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Custom goals can only be updated while your week is active." },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = customCompletionToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updateDate = new Date(parsed.data.date ?? new Date().toISOString().split("T")[0]);
  if (!isDateInWeek(updateDate, goal.weekStart, goal.weekEnd)) {
    return NextResponse.json(
      { error: "Date must fall within the goal period." },
      { status: 400 },
    );
  }

  const existing = await db.goalDailyUpdate.findUnique({
    where: {
      weeklyGoalId_date: { weeklyGoalId: id, date: updateDate },
    },
    include: {
      customCompletions: true,
    },
  });

  const mergedCompletions = new Map<string, boolean>();
  for (const completion of existing?.customCompletions ?? []) {
    mergedCompletions.set(completion.customItemId, completion.completed);
  }
  mergedCompletions.set(parsed.data.customItemId, parsed.data.completed);

  const update = await db.goalDailyUpdate.upsert({
    where: {
      weeklyGoalId_date: {
        weeklyGoalId: id,
        date: updateDate,
      },
    },
    update: {},
    create: {
      weeklyGoalId: id,
      date: updateDate,
      applicationsCount: existing?.applicationsCount ?? 0,
      interviewsCount: existing?.interviewsCount ?? 0,
      employmentHours: existing?.employmentHours ?? 0,
      notes: existing?.notes ?? "Custom goal progress.",
    },
  });

  await syncCustomCompletions(
    update.id,
    id,
    Array.from(mergedCompletions.entries()).map(([customItemId, completed]) => ({
      customItemId,
      completed,
    })),
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
