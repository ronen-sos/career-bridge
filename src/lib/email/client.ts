import nodemailer from "nodemailer";

export function getAppUrl(): string {
  const url = process.env.AUTH_URL?.trim();
  if (!url) return "http://localhost:3000";
  return url.replace(/\/$/, "");
}

function getGmailCredentials() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "").trim();

  if (!user || !pass) {
    return null;
  }

  return { user, pass };
}

export function isEmailConfigured(): boolean {
  return getGmailCredentials() !== null;
}

export function getEmailFromAddress(): string {
  const credentials = getGmailCredentials();
  if (!credentials) {
    throw new Error("Gmail is not configured.");
  }

  const name = process.env.EMAIL_FROM_NAME?.trim() || "Career Bridge";
  return `"${name}" <${credentials.user}>`;
}

function createTransporter(): nodemailer.Transporter | null {
  const credentials = getGmailCredentials();
  if (!credentials) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: credentials,
  });
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      ok: false,
      error:
        "Email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in your environment.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: getEmailFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { ok: true, id: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";

    if (/invalid login|authentication failed|username and password not accepted|535/i.test(message)) {
      return {
        ok: false,
        error:
          "Gmail rejected the login. Create a 16-character Google App Password at myaccount.google.com/apppasswords (not your regular password). GMAIL_USER must be the same Google account. If you use Google Workspace, your admin may need to allow app passwords.",
      };
    }

    return { ok: false, error: message };
  }
}
