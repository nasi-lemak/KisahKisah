import { createHash } from "node:crypto";

/** Sliding-window throttle over the timestamps (ms) of recent failed attempts. */
export function throttle(attempts: number[], now: number, limit: number, windowMs: number): { blocked: boolean; retryAfterMs: number } {
  const recent = attempts.filter((t) => t > now - windowMs).sort((a, b) => a - b);
  if (recent.length < limit) return { blocked: false, retryAfterMs: 0 };
  // Unblocked once the oldest attempt that keeps us at the limit falls out of the window.
  const pivot = recent[recent.length - limit];
  return { blocked: true, retryAfterMs: Math.max(0, pivot + windowMs - now) };
}

export function minutes(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  return `${m} minute${m === 1 ? "" : "s"}`;
}

const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwertyui", "qwerty123", "11111111", "iloveyou",
  "abcd1234", "admin123", "letmein1", "welcome1", "sayang123", "kisahkisah", "aaaaaaaa", "00000000", "88888888", "asdfghjk",
]);

/** Why a password isn't acceptable, or null. */
export function passwordProblem(password: string, username = ""): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "Password is too long.";
  const low = password.toLowerCase();
  if (COMMON.has(low)) return "That password is too common. Pick something harder to guess.";
  if (username && low.includes(username.toLowerCase()) && username.length >= 3) return "Your password can't contain your username.";
  if (/^(.)\1+$/.test(password)) return "That password is too easy to guess.";
  return null;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Tokens are emailed in full and stored only as a hash. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}
