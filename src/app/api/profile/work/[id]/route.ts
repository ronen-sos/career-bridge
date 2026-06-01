import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireContactComplete } from "@/lib/profile/require-contact";
import { workExperienceSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedExperience(id: string, userId: string) {
  const experience = await db.workExperience.findUnique({ where: { id } });
  if (!experience || experience.userId !== userId) return null;
  return experience;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const { id } = await context.params;
  const existing = await getOwnedExperience(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const experience = await db.workExperience.update({
    where: { id },
    data: {
      company,
      title,
      startDate: new Date(startDate),
      endDate: isCurrent || !endDate ? null : new Date(endDate),
      isCurrent,
      accomplishments,
    },
  });

  return NextResponse.json(experience);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const { id } = await context.params;
  const existing = await getOwnedExperience(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.workExperience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
