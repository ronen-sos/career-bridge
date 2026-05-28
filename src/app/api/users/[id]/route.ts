import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (id === session.user.id && parsed.data.role && parsed.data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 400 },
    );
  }

  const role = parsed.data.role ?? existing.role;

  if (role === "PARTICIPANT" && parsed.data.managerId) {
    const manager = await db.user.findFirst({
      where: {
        id: parsed.data.managerId,
        role: { in: ["MANAGER", "ADMIN"] },
      },
    });
    if (!manager) {
      return NextResponse.json(
        { error: "Selected manager is not valid." },
        { status: 400 },
      );
    }
  }

  const user = await db.user.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      managerId:
        role === "PARTICIPANT"
          ? parsed.data.managerId !== undefined
            ? parsed.data.managerId
            : existing.managerId
          : null,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
