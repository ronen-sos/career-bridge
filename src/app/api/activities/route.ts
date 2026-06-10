import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordJobApplication } from "@/lib/applications/record.server";
import { isAdminRole, isManagerRole, orgScope } from "@/lib/roles";
import { activitySchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isManagerRole(session.user.role)) {
    const participants = await db.user.findMany({
      where: { role: "PARTICIPANT", managerId: session.user.id },
      include: {
        activities: { orderBy: { date: "desc" }, take: 10 },
        weeklyGoals: { orderBy: { weekStart: "desc" }, take: 1 },
      },
    });

    if (participants.length === 0 && isAdminRole(session.user.role)) {
      const allParticipants = await db.user.findMany({
        where: { role: "PARTICIPANT", ...orgScope(session.user) },
        include: {
          activities: { orderBy: { date: "desc" }, take: 10 },
          weeklyGoals: { orderBy: { weekStart: "desc" }, take: 1 },
        },
      });
      return NextResponse.json(allParticipants);
    }

    return NextResponse.json(participants);
  }

  const activities = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      activities: { orderBy: { date: "desc" } },
      weeklyGoals: { orderBy: { weekStart: "desc" }, take: 4 },
    },
  });

  return NextResponse.json(activities);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = activitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (data.type === "APPLICATION") {
    try {
      const application = await recordJobApplication({
        userId: session.user.id,
        appliedAt: new Date(data.date),
        companyId: data.companyId,
        companyName: data.company,
        allowSimilarCompanyOverride: data.allowSimilarCompanyOverride,
        positionId: data.positionId,
        positionTitle: data.roleTitle,
        description: data.description,
        hoursSpent: data.hoursSpent,
      });

      return NextResponse.json(application, { status: 201 });
    } catch (err) {
      const similar = (err as Error & { similar?: unknown[] }).similar;
      if (similar) {
        return NextResponse.json(
          {
            error:
              "A similar company name already exists. Select it or confirm adding a new company.",
            similar,
          },
          { status: 409 },
        );
      }

      const message =
        err instanceof Error ? err.message : "Could not record application.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const activity = await db.jobSearchActivity.create({
    data: {
      userId: session.user.id,
      date: new Date(data.date),
      type: data.type,
      description: data.description,
      company: data.company || null,
      roleTitle: data.roleTitle || null,
      hoursSpent: data.hoursSpent,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isManagerRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { activityId, managerNotes } = await request.json();

  const existing = await db.jobSearchActivity.findUnique({
    where: { id: activityId },
    select: {
      user: { select: { managerId: true, organizationId: true } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed =
    session.user.role === "SUPER_ADMIN" ||
    (session.user.role === "ADMIN" &&
      existing.user.organizationId === session.user.organizationId) ||
    existing.user.managerId === session.user.id;
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activity = await db.jobSearchActivity.update({
    where: { id: activityId },
    data: {
      managerReviewed: true,
      managerNotes: managerNotes || null,
    },
  });

  return NextResponse.json(activity);
}
