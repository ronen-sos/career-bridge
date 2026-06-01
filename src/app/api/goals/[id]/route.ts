import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goalInclude, requireGoalAccess } from "@/lib/goals/access";
import { goalActionSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await requireGoalAccess(id, session.user.id, session.user.role);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const goal = await db.weeklyGoal.findUnique({
    where: { id },
    include: goalInclude,
  });

  return NextResponse.json(goal);
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await requireGoalAccess(id, session.user.id, session.user.role);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = goalActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const goal = await db.weeklyGoal.findUnique({ where: { id } });
  if (!goal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";
  const isParticipant =
    session.user.role === "PARTICIPANT" && goal.userId === session.user.id;

  const { action, managerApprovalNotes, weekReviewNotes } = parsed.data;

  if (action === "submit") {
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (goal.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only draft goals can be submitted." },
        { status: 409 },
      );
    }

    const updated = await db.weeklyGoal.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
      include: goalInclude,
    });
    return NextResponse.json(updated);
  }

  if (action === "approve") {
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (goal.status !== "PENDING_APPROVAL" && goal.status !== "DRAFT") {
      return NextResponse.json(
        { error: "This goal is not awaiting approval." },
        { status: 409 },
      );
    }

    const updated = await db.weeklyGoal.update({
      where: { id },
      data: {
        status: "ACTIVE",
        managerApprovedAt: new Date(),
        managerApprovedById: session.user.id,
        managerApprovalNotes: managerApprovalNotes || null,
      },
      include: goalInclude,
    });
    return NextResponse.json(updated);
  }

  if (action === "complete_week") {
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (goal.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Only active goals can be closed out." },
        { status: 409 },
      );
    }
    if (!weekReviewNotes?.trim()) {
      return NextResponse.json(
        { error: "Add week-end review notes before closing the goal." },
        { status: 400 },
      );
    }

    const updated = await db.weeklyGoal.update({
      where: { id },
      data: {
        status: "COMPLETED",
        weekReviewedAt: new Date(),
        weekReviewedById: session.user.id,
        weekReviewNotes: weekReviewNotes.trim(),
      },
      include: goalInclude,
    });
    return NextResponse.json(updated);
  }

  if (action === "reopen") {
    if (!isManager) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (goal.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed goals can be reopened." },
        { status: 409 },
      );
    }

    const updated = await db.weeklyGoal.update({
      where: { id },
      data: {
        status: "ACTIVE",
        weekReviewedAt: null,
        weekReviewedById: null,
        weekReviewNotes: null,
      },
      include: goalInclude,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
