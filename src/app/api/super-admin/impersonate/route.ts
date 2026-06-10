import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { IMPERSONATION_COOKIE } from "@/lib/impersonation";
import { requireSuperAdminSession } from "@/lib/super-admin/api-auth";

const IMPERSONATION_MAX_AGE_SECONDS = 60 * 60 * 8;

export async function POST(request: Request) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "You cannot view the app as another super admin." },
      { status: 400 },
    );
  }

  const store = await cookies();
  store.set(IMPERSONATION_COOKIE, target.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: IMPERSONATION_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ success: true, name: target.name });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(IMPERSONATION_COOKIE);
  return NextResponse.json({ success: true });
}
