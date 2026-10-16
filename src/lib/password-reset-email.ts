export function isPasswordResetEmailConfigured() {
  return false;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  void to;
  void name;
  void resetUrl;
  throw new Error("Password reset email sending is available through the Cloudflare Worker only.");
}
