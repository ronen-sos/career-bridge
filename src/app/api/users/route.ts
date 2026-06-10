import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEmailProvider, isEmailConfigured } from "@/lib/email/client";
import { isAdminRole, orgScope } from "@/lib/roles";
import { createInvitedUser } from "@/lib/users/invite";
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

  const users = await db.user.findMany({
    where: orgScope(session.user),
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      manager: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    users,
    emailConfigured: isEmailConfigured(),
    emailProvider: getEmailProvider(),
  });
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

  if (!session.user.organizationId) {
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
      organizationId: session.user.organizationId,
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
