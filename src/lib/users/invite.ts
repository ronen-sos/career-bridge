import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/client";
import { buildInviteEmail } from "@/lib/email/invite-email";
import { createUserSchema } from "@/lib/validations";
import type { z } from "zod";

type CreateUserInput = z.infer<typeof createUserSchema>;

export async function validateManagerId(
  role: CreateUserInput["role"],
  managerId: string | null | undefined,
): Promise<string | null> {
  if (role !== "PARTICIPANT" || !managerId) return null;

  const manager = await db.user.findFirst({
    where: {
      id: managerId,
      role: { in: ["MANAGER", "ADMIN"] },
    },
  });

  if (!manager) {
    throw new Error("Selected manager is not valid.");
  }

  return managerId;
}

export async function sendUserInvite({
  recipientName,
  recipientEmail,
  role,
  inviterName,
  personalNote,
}: {
  recipientName: string;
  recipientEmail: string;
  role: CreateUserInput["role"];
  inviterName: string;
  personalNote?: string;
}) {
  const { subject, html, text } = buildInviteEmail({
    recipientName,
    recipientEmail,
    role,
    inviterName,
    personalNote,
  });

  return sendEmail({
    to: recipientEmail,
    subject,
    html,
    text,
  });
}

export async function createInvitedUser(
  data: CreateUserInput,
  inviterName: string,
) {
  const email = data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const managerId = await validateManagerId(data.role, data.managerId);

  const user = await db.user.create({
    data: {
      email,
      name: data.name,
      role: data.role,
      managerId: data.role === "PARTICIPANT" ? managerId : null,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  const shouldSendInvite = data.sendInvite !== false;
  if (!shouldSendInvite) {
    return { user, emailSent: false as const };
  }

  const emailResult = await sendUserInvite({
    recipientName: user.name,
    recipientEmail: user.email,
    role: user.role,
    inviterName,
    personalNote: data.personalNote,
  });

  if (emailResult.ok) {
    const updated = await db.user.update({
      where: { id: user.id },
      data: { invitedAt: new Date() },
      include: {
        manager: { select: { id: true, name: true, email: true } },
      },
    });
    return { user: updated, emailSent: true as const };
  }

  return {
    user,
    emailSent: false as const,
    emailError: emailResult.error,
  };
}

export async function resendUserInvite(
  userId: string,
  inviterName: string,
  personalNote?: string,
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const emailResult = await sendUserInvite({
    recipientName: user.name,
    recipientEmail: user.email,
    role: user.role,
    inviterName,
    personalNote,
  });

  if (!emailResult.ok) {
    return { user, emailSent: false as const, emailError: emailResult.error };
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { invitedAt: new Date() },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  return { user: updated, emailSent: true as const };
}
