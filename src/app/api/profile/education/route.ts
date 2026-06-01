import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireContactComplete } from "@/lib/profile/require-contact";
import { educationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const body = await request.json();
  const parsed = educationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const {
    startDate,
    endDate,
    isCurrent,
    accomplishments,
    institution,
    degree,
    fieldOfStudy,
  } = parsed.data;

  const count = await db.education.count({
    where: { userId: session.user.id },
  });

  const entry = await db.education.create({
    data: {
      userId: session.user.id,
      institution,
      degree,
      fieldOfStudy: fieldOfStudy || null,
      startDate: new Date(startDate),
      endDate: isCurrent || !endDate ? null : new Date(endDate),
      isCurrent,
      accomplishments,
      sortOrder: count,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
