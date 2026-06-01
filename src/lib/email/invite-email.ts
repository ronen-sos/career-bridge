import { getAppUrl } from "@/lib/email/client";

type Role = "PARTICIPANT" | "MANAGER" | "ADMIN";

type InviteEmailInput = {
  recipientName: string;
  recipientEmail: string;
  role: Role;
  inviterName: string;
  personalNote?: string;
};

const ROLE_LABELS: Record<Role, string> = {
  PARTICIPANT: "Participant",
  MANAGER: "Program Manager",
  ADMIN: "Administrator",
};

function roleBenefits(role: Role): string[] {
  if (role === "PARTICIPANT") {
    return [
      "Log applications, networking, interviews, and training in one place",
      "Set weekly goals and see your progress at a glance",
      "Get feedback and encouragement from your program manager",
      "Explore career path guides for trades, warehouse, hospitality, and more",
      "Build momentum in your job search with gentle accountability",
    ];
  }

  if (role === "MANAGER") {
    return [
      "See participant activity and weekly progress in one dashboard",
      "Review job search logs and leave supportive feedback",
      "Help men in recovery stay accountable on the path to meaningful work",
      "Access the same career resources you can point participants toward",
    ];
  }

  return [
    "Manage who can access Career Bridge and invite new participants",
    "Oversee program activity and support your team of managers",
    "Keep the program organized as Bridge to Thrive grows",
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildInviteEmail(input: InviteEmailInput) {
  const loginUrl = `${getAppUrl()}/login`;
  const roleLabel = ROLE_LABELS[input.role];
  const benefits = roleBenefits(input.role);
  const personalNote = input.personalNote?.trim();

  const subject = `You're invited to Career Bridge — Bridge to Thrive`;

  const textBenefits = benefits.map((b) => `• ${b}`).join("\n");

  const text = [
    `Hi ${input.recipientName},`,
    "",
    `${input.inviterName} has invited you to join Career Bridge, a program of Bridge to Thrive.`,
    "",
    "Career Bridge is a mobile-friendly app that supports your job search journey with accountability, career resources, and connection to your program team — especially for men in recovery building toward meaningful careers in the St. Paul area.",
    "",
    personalNote ? `A note from ${input.inviterName}:\n"${personalNote}"\n` : "",
    `You've been invited as a ${roleLabel}. Here's what you can do:`,
    textBenefits,
    "",
    "To get started, sign in with Google using this exact email address:",
    input.recipientEmail,
    "",
    loginUrl,
    "",
    "We're glad you're here. If you have questions, reach out to your program manager.",
    "",
    "— Bridge to Thrive / Career Bridge",
  ]
    .filter(Boolean)
    .join("\n");

  const benefitsHtml = benefits
    .map((benefit) => `<li style="margin-bottom:8px;">${escapeHtml(benefit)}</li>`)
    .join("");

  const personalNoteHtml = personalNote
    ? `<p style="margin:24px 0;padding:16px 20px;background:#ecfdf5;border-left:4px solid #047857;border-radius:8px;color:#064e3b;font-style:italic;">"${escapeHtml(personalNote)}"<br><span style="font-style:normal;font-size:14px;color:#065f46;">— ${escapeHtml(input.inviterName)}</span></p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:Georgia,'Times New Roman',serif;color:#1c1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fafaf9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e5e4;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#065f46,#064e3b);padding:28px 32px;color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a7f3d0;">Bridge to Thrive</p>
              <h1 style="margin:0;font-size:28px;font-weight:700;line-height:1.2;">Welcome to Career Bridge</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi ${escapeHtml(input.recipientName)},</p>
              <p style="margin:0 0 16px;"><strong>${escapeHtml(input.inviterName)}</strong> has invited you to join <strong>Career Bridge</strong> — a program of Bridge to Thrive.</p>
              <p style="margin:0 0 16px;">Career Bridge is a mobile-friendly app that supports your job search with accountability, career resources, and connection to your program team. It's designed especially for men in recovery who are building toward meaningful careers in the St. Paul area.</p>
              ${personalNoteHtml}
              <p style="margin:0 0 12px;font-weight:600;">You've been invited as a <span style="color:#047857;">${escapeHtml(roleLabel)}</span>. Here's what awaits you:</p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#44403c;">${benefitsHtml}</ul>
              <p style="margin:0 0 16px;">When you're ready, sign in with Google using <strong>${escapeHtml(input.recipientEmail)}</strong> — the same address this invitation was sent to.</p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${loginUrl}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;font-size:16px;">Sign in to Career Bridge</a>
              </p>
              <p style="margin:0;font-size:14px;color:#78716c;">We're glad you're here. If you have questions, reach out to your program manager.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f5f5f4;font-size:12px;color:#78716c;text-align:center;font-family:system-ui,sans-serif;">
              Bridge to Thrive · Career Bridge · <a href="https://bridgetothrive.org" style="color:#047857;">bridgetothrive.org</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
