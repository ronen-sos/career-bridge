import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { buildQuestionEmail } from "@/lib/email/question-email";
import { buildQuestionReplyEmail } from "@/lib/email/question-reply-email";
import { findParticipantCurrentGoal } from "@/lib/goals/access";
import { hasUnreadManagerReply } from "@/lib/questions/unread";

export async function createParticipantQuestion(userId: string, question: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user?.managerId || !user.manager) {
    throw new Error("No program manager is assigned to your account.");
  }

  const goal = await findParticipantCurrentGoal(userId);

  const record = await db.participantQuestion.create({
    data: {
      userId,
      managerId: user.managerId,
      weeklyGoalId: goal?.id ?? null,
      question: question.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const emailContent = buildQuestionEmail({
    managerName: user.manager.name ?? "Program Manager",
    managerEmail: user.manager.email,
    participantName: user.name ?? "Participant",
    question: record.question,
  });

  const emailResult = await sendEmail({
    to: emailContent.to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return {
    question: record,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
  };
}

export async function listQuestionsForUser(
  userId: string,
  role: string,
  options: { unreadOnly?: boolean } = {},
) {
  if (role === "PARTICIPANT") {
    return db.participantQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        manager: { select: { id: true, name: true } },
      },
    });
  }

  if (role === "MANAGER") {
    return db.participantQuestion.findMany({
      where: {
        managerId: userId,
        ...(options.unreadOnly ? { managerRead: false } : {}),
      },
      orderBy: [{ managerRead: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  if (role === "ADMIN") {
    return db.participantQuestion.findMany({
      where: options.unreadOnly ? { managerRead: false } : undefined,
      orderBy: [{ managerRead: "asc" }, { createdAt: "desc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true } },
      },
    });
  }

  return [];
}

export async function countUnreadQuestionsForManager(managerId: string) {
  return db.participantQuestion.count({
    where: { managerId, managerRead: false },
  });
}

export async function countUnreadRepliesForParticipant(userId: string) {
  const questions = await db.participantQuestion.findMany({
    where: { userId, managerReply: { not: null } },
    select: {
      managerReply: true,
      participantReadAt: true,
    },
  });

  return questions.filter((q) => hasUnreadManagerReply(q)).length;
}

export async function markParticipantRepliesRead(
  userId: string,
  questionIds?: string[],
) {
  const questions = await db.participantQuestion.findMany({
    where: {
      userId,
      managerReply: { not: null },
      ...(questionIds?.length ? { id: { in: questionIds } } : {}),
    },
    select: {
      id: true,
      managerReply: true,
      participantReadAt: true,
    },
  });

  const toMark = questions.filter((q) => hasUnreadManagerReply(q));
  if (toMark.length === 0) return 0;

  const now = new Date();
  await db.participantQuestion.updateMany({
    where: { id: { in: toMark.map((q) => q.id) } },
    data: { participantReadAt: now },
  });

  return toMark.length;
}

export async function notifyParticipantOfReply(
  questionId: string,
  reply: string,
) {
  const question = await db.participantQuestion.findUnique({
    where: { id: questionId },
    include: {
      user: { select: { name: true, email: true } },
      manager: { select: { name: true } },
    },
  });

  if (!question?.user || !question.manager) return { emailSent: false };

  const emailContent = buildQuestionReplyEmail({
    participantName: question.user.name ?? "Participant",
    participantEmail: question.user.email,
    managerName: question.manager.name ?? "Your program manager",
    question: question.question,
    reply,
    questionId: question.id,
  });

  const emailResult = await sendEmail({
    to: emailContent.to,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return { emailSent: emailResult.ok };
}

export async function listQuestionsForParticipant(participantId: string) {
  return db.participantQuestion.findMany({
    where: { userId: participantId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function countUnreadQuestionsAll() {
  return db.participantQuestion.count({
    where: { managerRead: false },
  });
}
