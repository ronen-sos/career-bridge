import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activitySchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";

  if (isManager) {
    const participants = await db.user.findMany({
      where: { role: "PARTICIPANT", managerId: session.user.id },
      include: {
        activities: { orderBy: { date: "desc" }, take: 10 },
        weeklyGoals: { orderBy: { weekStart: "desc" }, take: 1 },
      },
    });

    if (participants.length === 0 && session.user.role === "ADMIN") {
      const allParticipants = await db.user.findMany({
        where: { role: "PARTICIPANT" },
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

  const activity = await db.jobSearchActivity.create({
    data: {
      userId: session.user.id,
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      description: parsed.data.description,
      company: parsed.data.company || null,
      roleTitle: parsed.data.roleTitle || null,
      hoursSpent: parsed.data.hoursSpent,
    },
  });

  return NextResponse.json(activity, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isManager =
    session.user.role === "MANAGER" || session.user.role === "ADMIN";
  if (!isManager) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { activityId, managerNotes } = await request.json();

  const activity = await db.jobSearchActivity.update({
    where: { id: activityId },
    data: {
      managerReviewed: true,
      managerNotes: managerNotes || null,
    },
  });

  return NextResponse.json(activity);
}
