import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin/api-auth";
import { organizationSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db.organization.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  const organization = await db.organization.update({
    where: { id },
    data: { name: parsed.data.name.trim() },
    select: { id: true, name: true },
  });

  return NextResponse.json(organization);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await db.organization.findUnique({
    where: { id },
    select: { id: true, _count: { select: { users: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  if (existing._count.users > 0) {
    return NextResponse.json(
      {
        error:
          "This organization still has users. Move or remove them before deleting it.",
      },
      { status: 409 },
    );
  }

  await db.organization.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
