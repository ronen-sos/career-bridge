/**
 * Test Gmail SMTP — run with: npm run email:test
 * Does not print your password.
 */
import "dotenv/config";

import { isEmailConfigured, sendEmail } from "../src/lib/email/client";

async function main() {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "").trim();

  console.log("Gmail configured:", isEmailConfigured());
  console.log("GMAIL_USER:", user ?? "(not set)");

  if (pass) {
    const looksLikeAppPassword = /^[a-zA-Z0-9]{16}$/.test(pass);
    console.log(
      "GMAIL_APP_PASSWORD length:",
      pass.length,
      looksLikeAppPassword ? "(format OK)" : "(does NOT look like a 16-char App Password)",
    );
    if (!looksLikeAppPassword) {
      console.log(
        "\n⚠ Google App Passwords are 16 characters (e.g. abcd efgh ijkl mnop).",
      );
      console.log(
        "  Your regular Google sign-in password will not work for SMTP.",
      );
      console.log("  Create one at: https://myaccount.google.com/apppasswords\n");
    }
  } else {
    console.log("GMAIL_APP_PASSWORD: (not set)");
  }

  if (!isEmailConfigured() || !user) {
    process.exit(1);
  }

  const to = process.argv[2] ?? user;
  console.log(`Sending test email to ${to}...`);

  const result = await sendEmail({
    to,
    subject: "Career Bridge — email test",
    text: "If you received this, Gmail SMTP is working for Career Bridge invites.",
    html: "<p>If you received this, Gmail SMTP is working for Career Bridge invites.</p>",
  });

  if (result.ok) {
    console.log("Success.", result.id ?? "");
    return;
  }

  console.error("Failed:", result.error);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
