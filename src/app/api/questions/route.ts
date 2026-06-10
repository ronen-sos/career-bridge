import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  createParticipantQuestion,
  listQuestionsForUser,
} from "@/lib/questions/record.server";
import { participantQuestionSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const questions = await listQuestionsForUser(
    session.user.id,
    session.user.role,
    { unreadOnly, organizationId: session.user.organizationId },
  );

  return NextResponse.json(
    questions.map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      managerReadAt: q.managerReadAt?.toISOString() ?? null,
      participantReadAt: q.participantReadAt?.toISOString() ?? null,
    })),
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PARTICIPANT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = participantQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await createParticipantQuestion(
      session.user.id,
      parsed.data.question,
    );

    return NextResponse.json(
      {
        question: {
          ...result.question,
          createdAt: result.question.createdAt.toISOString(),
          updatedAt: result.question.updatedAt.toISOString(),
          managerReadAt: result.question.managerReadAt?.toISOString() ?? null,
        },
        emailSent: result.emailSent,
        emailError: result.emailError,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send question.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
