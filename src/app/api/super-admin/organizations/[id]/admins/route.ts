import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/client";
import { requireSuperAdminSession } from "@/lib/super-admin/api-auth";
import { createInvitedUser } from "@/lib/users/invite";
import { createOrgAdminSchema } from "@/lib/validations";

export const maxDuration = 30;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSuperAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  const organization = await db.organization.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found." },
      { status: 404 },
    );
  }

  const body = await request.json();
  const parsed = createOrgAdminSchema.safeParse(body);
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

  try {
    const result = await createInvitedUser(
      {
        email: parsed.data.email,
        name: parsed.data.name,
        role: "ADMIN",
        managerId: null,
        sendInvite: parsed.data.sendInvite,
        personalNote: parsed.data.personalNote,
      },
      {
        inviterName: session.user.name ?? "The Career Path team",
        organizationId: organization.id,
      },
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create admin.";

    if (message.includes("already exists")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
