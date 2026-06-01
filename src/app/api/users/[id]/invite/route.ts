import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email/client";
import { resendUserInvite } from "@/lib/users/invite";
import { resendInviteSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD before sending invites.",
      },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = resendInviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await resendUserInvite(
      id,
      session.user.name ?? "Your program admin",
      parsed.data.personalNote,
    );

    if (!result.emailSent) {
      return NextResponse.json(
        { error: result.emailError ?? "Could not send invite email." },
        { status: 502 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not resend invite.";

    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
