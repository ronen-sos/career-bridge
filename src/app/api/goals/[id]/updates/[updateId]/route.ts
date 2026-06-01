import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireGoalAccess } from "@/lib/goals/access";
import { dailyUpdateReviewSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string; updateId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";
  if (!isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, updateId } = await context.params;
  const access = await requireGoalAccess(id, session.user.id, session.user.role);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = dailyUpdateReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db.goalDailyUpdate.findFirst({
    where: { id: updateId, weeklyGoalId: id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update = await db.goalDailyUpdate.update({
    where: { id: updateId },
    data: {
      managerReviewed: true,
      managerReviewedAt: new Date(),
      managerNotes: parsed.data.managerNotes?.trim() || null,
    },
  });

  return NextResponse.json(update);
}
