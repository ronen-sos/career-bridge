/**
 * Test invite email — run with: npm run email:test
 */
import "dotenv/config";

import {
  getEmailProvider,
  isEmailConfigured,
  sendEmail,
} from "../src/lib/email/client";

async function main() {
  console.log("Email configured:", isEmailConfigured());
  console.log("Provider:", getEmailProvider() ?? "(none)");

  if (!isEmailConfigured()) {
    console.log("\nSet RESEND_API_KEY + EMAIL_FROM (production)");
    console.log("or GMAIL_USER + GMAIL_APP_PASSWORD (local dev)\n");
    process.exit(1);
  }

  const to =
    process.argv[2] ??
    process.env.GMAIL_USER?.trim() ??
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1];

  if (!to) {
    console.error("Pass a recipient: npm run email:test you@example.com");
    process.exit(1);
  }

  console.log(`Sending test email to ${to}...`);

  const result = await sendEmail({
    to,
    subject: "Career Path — email test",
    text: "If you received this, invite emails are working.",
    html: "<p>If you received this, invite emails are working.</p>",
  });

  if (result.ok) {
    console.log(`Success via ${result.provider}.`, result.id ?? "");
    return;
  }

  console.error("Failed:", result.error);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
