import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireSuperAdminSession } from "@/lib/super-admin/api-auth";
import { organizationSchema } from "@/lib/validations";

export async function GET() {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizations = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      logoMimeType: true,
      updatedAt: true,
      createdAt: true,
      _count: { select: { users: true } },
      users: {
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true, invitedAt: true },
        orderBy: { name: "asc" },
      },
    },
  });

  return NextResponse.json({
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      hasLogo: Boolean(org.logoMimeType),
      logoUpdatedAt: org.updatedAt.toISOString(),
      createdAt: org.createdAt.toISOString(),
      userCount: org._count.users,
      admins: org.users,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = organizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const organization = await db.organization.create({
    data: { name: parsed.data.name.trim() },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(organization, { status: 201 });
}
