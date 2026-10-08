export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72; // bcrypt ignores everything past 72 bytes

export const PASSWORD_ERROR = `Password must be at least ${MIN_PASSWORD_LENGTH} characters and no more than ${MAX_PASSWORD_LENGTH} UTF-8 bytes.`;

export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD_LENGTH &&
    new TextEncoder().encode(password).length <= MAX_PASSWORD_LENGTH
  );
}

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/** Accepts only absolute https:// URLs; returns null for anything else. */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
