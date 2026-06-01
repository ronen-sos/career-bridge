import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireContactComplete } from "@/lib/profile/require-contact";
import { workExperienceSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const body = await request.json();
  const parsed = workExperienceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { startDate, endDate, isCurrent, accomplishments, company, title } =
    parsed.data;

  const count = await db.workExperience.count({
    where: { userId: session.user.id },
  });

  const experience = await db.workExperience.create({
    data: {
      userId: session.user.id,
      company,
      title,
      startDate: new Date(startDate),
      endDate: isCurrent || !endDate ? null : new Date(endDate),
      isCurrent,
      accomplishments,
      sortOrder: count,
    },
  });

  return NextResponse.json(experience, { status: 201 });
}
