import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyParticipantOfReply } from "@/lib/questions/record.server";
import { questionReviewSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const question = await db.participantQuestion.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, organizationId: true },
      },
      manager: { select: { name: true } },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isManager =
    session.user.role === "MANAGER" && question.managerId === session.user.id;
  const isAdmin =
    session.user.role === "ADMIN" &&
    question.user.organizationId === session.user.organizationId;
  const isSuper = session.user.role === "SUPER_ADMIN";

  if (!isManager && !isAdmin && !isSuper) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = questionReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const replyProvided = parsed.data.managerReply !== undefined;
  const newReply = replyProvided
    ? parsed.data.managerReply?.trim() || null
    : question.managerReply;
  const replyChanged =
    replyProvided && newReply !== question.managerReply && Boolean(newReply);

  const updated = await db.participantQuestion.update({
    where: { id },
    data: {
      managerRead: true,
      managerReadAt: question.managerReadAt ?? new Date(),
      ...(replyProvided ? { managerReply: newReply } : {}),
      ...(replyChanged ? { participantReadAt: null } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (replyChanged && newReply) {
    await notifyParticipantOfReply(id, newReply);
  }

  return NextResponse.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    managerReadAt: updated.managerReadAt?.toISOString() ?? null,
    participantReadAt: updated.participantReadAt?.toISOString() ?? null,
  });
}
