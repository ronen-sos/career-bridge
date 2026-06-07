import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalInclude, requireGoalAccess } from "@/lib/goals/access";
import { isDateInWeek } from "@/lib/goals/progress";
import { dailyGoalUpdateSchema } from "@/lib/validations";

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
      {
        error:
          "Updates are only available after your program manager activates your goals.",
      },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = dailyGoalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const updateDate = new Date(parsed.data.date);
  if (!isDateInWeek(updateDate, goal.weekStart, goal.weekEnd)) {
    return NextResponse.json(
      { error: "Date must fall within the goal period." },
      { status: 400 },
    );
  }

  const hasNumericActivity =
    parsed.data.applicationsCount > 0 ||
    parsed.data.interviewsCount > 0 ||
    parsed.data.employmentHours > 0;

  const hasCustomCompletion = parsed.data.customCompletions?.some(
    (c) => c.completed,
  );

  if (!hasNumericActivity && !hasCustomCompletion) {
    return NextResponse.json(
      {
        error:
          "Log at least one application, interview, hour of activity, or completed custom goal for this day.",
      },
      { status: 400 },
    );
  }

  const update = await db.goalDailyUpdate.upsert({
    where: {
      weeklyGoalId_date: {
        weeklyGoalId: id,
        date: updateDate,
      },
    },
    update: {
      applicationsCount: parsed.data.applicationsCount,
      interviewsCount: parsed.data.interviewsCount,
      employmentHours: parsed.data.employmentHours,
      notes: parsed.data.notes,
      managerReviewed: false,
      managerReviewedAt: null,
      managerNotes: null,
      submittedAt: new Date(),
    },
    create: {
      weeklyGoalId: id,
      date: updateDate,
      applicationsCount: parsed.data.applicationsCount,
      interviewsCount: parsed.data.interviewsCount,
      employmentHours: parsed.data.employmentHours,
      notes: parsed.data.notes,
    },
  });

  const { syncCustomCompletions } = await import("@/lib/goals/custom-items.server");
  await syncCustomCompletions(
    update.id,
    id,
    parsed.data.customCompletions ?? [],
  );

  const fullGoal = await db.weeklyGoal.findUnique({
    where: { id },
    include: goalInclude,
  });

  return NextResponse.json({ update, goal: fullGoal }, { status: 201 });
}
