import { getAppUrl } from "@/lib/email/client";

type QuestionReplyEmailInput = {
  participantName: string;
  participantEmail: string;
  managerName: string;
  question: string;
  reply: string;
  questionId: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildQuestionReplyEmail(input: QuestionReplyEmailInput) {
  const messagesUrl = `${getAppUrl()}/dashboard?highlight=${input.questionId}#manager-messages`;
  const subject = `${input.managerName} replied to your question — Career Path`;

  const text = [
    `Hi ${input.participantName},`,
    "",
    `${input.managerName} replied to your question in Career Path:`,
    "",
    `Your question: ${input.question}`,
    "",
    `Reply: ${input.reply}`,
    "",
    "Read the full conversation on your home page:",
    messagesUrl,
    "",
    "— Career Path / Bridge to Thrive",
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
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a7f3d0;">Career Path</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;line-height:1.2;">${escapeHtml(input.managerName)} replied</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 16px;">Hi ${escapeHtml(input.participantName)},</p>
              <p style="margin:0 0 16px;">Your program manager replied to your question:</p>
              <blockquote style="margin:0 0 16px;padding:16px 20px;background:#f5f5f4;border-left:4px solid #78716c;border-radius:8px;color:#44403c;white-space:pre-wrap;font-size:14px;">${escapeHtml(input.question)}</blockquote>
              <p style="margin:0 0 8px;font-weight:600;">Reply:</p>
              <blockquote style="margin:0 0 24px;padding:16px 20px;background:#ecfdf5;border-left:4px solid #047857;border-radius:8px;color:#1c1917;white-space:pre-wrap;">${escapeHtml(input.reply)}</blockquote>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${messagesUrl}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:12px;font-size:16px;">Read on Career Path</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f5f5f4;font-size:12px;color:#78716c;text-align:center;font-family:system-ui,sans-serif;">
              Bridge to Thrive · Career Path
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text, to: input.participantEmail };
}
