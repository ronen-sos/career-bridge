import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/client";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";
import { createInvitedUser } from "@/lib/users/invite";
import { getUserAdminData } from "@/lib/users/list.server";
import { createUserSchema } from "@/lib/validations";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await getUserAdminData(session.user));
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

  if (parsed.data.sendInvite !== false && !isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set RESEND_API_KEY + EMAIL_FROM on Railway, or GMAIL_USER + GMAIL_APP_PASSWORD for local dev.",
      },
      { status: 503 },
    );
  }

  let organizationId = session.user.organizationId;

  if (isSuperAdmin(session.user.role) && parsed.data.organizationId) {
    const organization = await db.organization.findUnique({
      where: { id: parsed.data.organizationId },
      select: { id: true },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Selected organization was not found." },
        { status: 400 },
      );
    }
    organizationId = organization.id;
  }

  if (!organizationId) {
    return NextResponse.json(
      {
        error:
          "Your account is not assigned to an organization, so it cannot invite users here.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createInvitedUser(parsed.data, {
      inviterName: session.user.name ?? "Your program admin",
      organizationId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create user.";

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    if (message.includes("manager")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
