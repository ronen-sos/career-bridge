import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  if (parsed.data.role === "PARTICIPANT" && parsed.data.managerId) {
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

  const user = await db.user.create({
    data: {
      email,
      name: parsed.data.name,
      role: parsed.data.role,
      managerId:
        parsed.data.role === "PARTICIPANT"
          ? parsed.data.managerId || null
          : null,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(user, { status: 201 });
}
