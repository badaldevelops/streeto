function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

export function passwordResetEmailContent(name: string, resetUrl: string) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Reset your Qtoo password",
    text: `Hi ${name || "there"},\n\nWe received a request to reset your Qtoo password. Use this link within 30 minutes to choose a new password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email. Your password will not change until you use the link.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937"><h1 style="color:#c2410c">Reset your Qtoo password</h1><p>Hi ${safeName},</p><p>We received a request to reset your Qtoo password. Use the button below within 30 minutes to choose a new password.</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#ea580c;color:#fff;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Choose a new password</a></p><p>If the button does not work, copy this link into your browser:</p><p style="word-break:break-all">${safeUrl}</p><p>If you did not request this, you can ignore this email. Your password will not change until you use the link.</p></div>`,
  };
}
