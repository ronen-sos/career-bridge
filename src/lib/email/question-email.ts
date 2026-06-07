import { getAppUrl } from "@/lib/email/client";

type QuestionEmailInput = {
  managerName: string;
  managerEmail: string;
  participantName: string;
  question: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildQuestionEmail(input: QuestionEmailInput) {
  const managerUrl = `${getAppUrl()}/manager`;
  const subject = `${input.participantName} has a question — Career Bridge`;

  const text = [
    `Hi ${input.managerName},`,
    "",
    `${input.participantName} sent you a question through Career Bridge:`,
    "",
    input.question,
    "",
    "View and respond from your team dashboard:",
    managerUrl,
    "",
    "— Career Bridge / Bridge to Thrive",
  ].join("\n");

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
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a7f3d0;">Career Bridge</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;line-height:1.2;">New question from ${escapeHtml(input.participantName)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi ${escapeHtml(input.managerName)},</p>
              <p style="margin:0 0 16px;"><strong>${escapeHtml(input.participantName)}</strong> asked:</p>
              <blockquote style="margin:0 0 24px;padding:16px 20px;background:#f5f5f4;border-left:4px solid #047857;border-radius:8px;color:#1c1917;white-space:pre-wrap;">${escapeHtml(input.question)}</blockquote>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${managerUrl}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;font-size:16px;">View in Career Bridge</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f5f5f4;font-size:12px;color:#78716c;text-align:center;font-family:system-ui,sans-serif;">
              Bridge to Thrive · Career Bridge
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text, to: input.managerEmail };
}
