import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireContactComplete } from "@/lib/profile/require-contact";
import { educationSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedEducation(id: string, userId: string) {
  const entry = await db.education.findUnique({ where: { id } });
  if (!entry || entry.userId !== userId) return null;
  return entry;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const { id } = await context.params;
  const existing = await getOwnedEducation(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  const entry = await db.education.update({
    where: { id },
    data: {
      institution,
      degree,
      fieldOfStudy: fieldOfStudy || null,
      startDate: new Date(startDate),
      endDate: isCurrent || !endDate ? null : new Date(endDate),
      isCurrent,
      accomplishments,
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireContactComplete(session.user.id);
  if (blocked) return blocked;

  const { id } = await context.params;
  const existing = await getOwnedEducation(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.education.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
