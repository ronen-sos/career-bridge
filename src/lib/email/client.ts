import nodemailer from "nodemailer";

const SMTP_TIMEOUT_MS = 15_000;

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

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return getResendConfig() !== null || getGmailCredentials() !== null;
}

export function getEmailProvider(): "resend" | "gmail" | null {
  if (getResendConfig()) return "resend";
  if (getGmailCredentials()) return "gmail";
  return null;
}

function getGmailFromAddress(): string {
  const credentials = getGmailCredentials();
  if (!credentials) {
    throw new Error("Gmail is not configured.");
  }

  const name = process.env.EMAIL_FROM_NAME?.trim() || "Career Bridge";
  return `"${name}" <${credentials.user}>`;
}

function createGmailTransporter(): nodemailer.Transporter | null {
  const credentials = getGmailCredentials();
  if (!credentials) return null;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: credentials,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id?: string; provider: "resend" | "gmail" }
  | { ok: false; error: string };

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getResendConfig();
  if (!config) {
    return { ok: false, error: "Resend is not configured." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SMTP_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        error: `Resend error (${response.status}): ${body.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as { id?: string };
    return { ok: true, id: data.id, provider: "resend" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Email request timed out. Try again." };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send via Resend.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendViaGmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transporter = createGmailTransporter();

  if (!transporter) {
    return {
      ok: false,
      error:
        "Gmail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: getGmailFromAddress(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    return { ok: true, id: info.messageId, provider: "gmail" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email.";

    if (/invalid login|authentication failed|username and password not accepted|535/i.test(message)) {
      return {
        ok: false,
        error:
          "Gmail rejected the login. Use a 16-character Google App Password at myaccount.google.com/apppasswords.",
      };
    }

    if (/timeout|ETIMEDOUT|ESOCKET/i.test(message)) {
      return {
        ok: false,
        error:
          "Gmail SMTP timed out. Railway blocks SMTP on most plans — use RESEND_API_KEY in production instead.",
      };
    }

    return { ok: false, error: message };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  // Resend uses HTTPS (port 443) and works on Railway; Gmail SMTP does not.
  if (getResendConfig()) {
    return sendViaResend(input);
  }

  if (getGmailCredentials()) {
    return sendViaGmail(input);
  }

  return {
    ok: false,
    error:
      "Email is not configured. Set RESEND_API_KEY + EMAIL_FROM for production, or GMAIL_USER + GMAIL_APP_PASSWORD for local dev.",
  };
}
