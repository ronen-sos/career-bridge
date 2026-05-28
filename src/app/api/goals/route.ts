import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { weeklyGoalSchema } from "@/lib/validations";

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

  const goal = await db.weeklyGoal.upsert({
    where: {
      userId_weekStart: {
        userId: session.user.id,
        weekStart: new Date(parsed.data.weekStart),
      },
    },
    update: {
      targetApplications: parsed.data.targetApplications,
      targetNetworking: parsed.data.targetNetworking,
      targetHours: parsed.data.targetHours,
      notes: parsed.data.notes || null,
    },
    create: {
      userId: session.user.id,
      weekStart: new Date(parsed.data.weekStart),
      targetApplications: parsed.data.targetApplications,
      targetNetworking: parsed.data.targetNetworking,
      targetHours: parsed.data.targetHours,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
