import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";
import { updateUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}

/** Org admins may only manage non-super-admin users inside their own org. */
function canManageUser(
  session: { user: { role: string; organizationId: string | null } },
  target: { role: string; organizationId: string | null },
): boolean {
  if (isSuperAdmin(session.user.role)) return true;
  if (isSuperAdmin(target.role)) return false;
  return (
    target.organizationId !== null &&
    target.organizationId === session.user.organizationId
  );
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

  if (!canManageUser(session, existing)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (id === session.user.id && parsed.data.role && !isAdminRole(parsed.data.role)) {
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 400 },
    );
  }

  if (isSuperAdmin(existing.role) && parsed.data.role) {
    return NextResponse.json(
      { error: "The super admin role cannot be changed here." },
      { status: 400 },
    );
  }

  const role = parsed.data.role ?? existing.role;

  if (role === "PARTICIPANT" && parsed.data.managerId) {
    const manager = await db.user.findFirst({
      where: {
        id: parsed.data.managerId,
        role: { in: ["MANAGER", "ADMIN", "SUPER_ADMIN"] },
        organizationId: existing.organizationId,
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

  if (!canManageUser(session, existing)) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
