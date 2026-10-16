import { env } from "cloudflare:workers";
import { passwordResetEmailContent } from "./password-reset-email-content";

type EmailRuntime = {
  BREVO_API_KEY?: string;
  PASSWORD_RESET_FROM?: string;
};

function getEmailRuntime() {
  return env as typeof env & EmailRuntime;
}

export function isPasswordResetEmailConfigured() {
  const runtime = getEmailRuntime();
  return Boolean(runtime.BREVO_API_KEY?.trim() && runtime.PASSWORD_RESET_FROM?.trim());
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const runtime = getEmailRuntime();
  const apiKey = runtime.BREVO_API_KEY?.trim();
  const from = runtime.PASSWORD_RESET_FROM?.trim();
  if (!apiKey || !from) throw new Error("Password reset email is not configured.");
  const content = passwordResetEmailContent(name, resetUrl);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: from, name: "Qtoo" },
      to: [{ email: to, name }],
      subject: content.subject,
      textContent: content.text,
      htmlContent: content.html,
    }),
  });

  if (!response.ok) {
    const error = new Error("Brevo transactional email delivery failed.") as Error & { code: string };
    error.code = `brevo_${response.status}`;
    throw error;
  }

  return await response.json() as { messageId: string };
}
