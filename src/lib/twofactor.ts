import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { all, one, run, tx } from "./db";
import { webhookSecret } from "./cinema";
import { issueToken, consumeToken, peekToken } from "./security";
import { base32Decode, newRecoveryCodes, normalizeRecovery, verifyTotp } from "./totp-core";

/** Secrets are encrypted at rest with AES-256-GCM. Set TOTP_KEY in production (else derived from CINEMA_WEBHOOK_SECRET). */
const key = () => createHash("sha256").update(`totp:${process.env.TOTP_KEY || webhookSecret()}`).digest();

export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(secret, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptSecret(blob: string): string {
  const [v, iv, tag, enc] = blob.split(".");
  if (v !== "v1") throw new Error("Unknown secret format");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
}

const hashCode = (code: string) => createHash("sha256").update(`rc:${normalizeRecovery(code)}`).digest("hex");

export function twoFactorEnabled(userId: number): boolean {
  return !!one("SELECT 1 x FROM users WHERE id = ? AND totp_secret IS NOT NULL AND totp_enabled_at IS NOT NULL", userId);
}

/** Check a 6-digit code against the confirmed (or pending, during setup) secret. Records the step to block replays. */
export function checkCode(userId: number, code: string, which: "active" | "pending" = "active"): boolean {
  const u = one<{ totp_secret: string | null; totp_pending: string | null; totp_last_step: number }>(
    "SELECT totp_secret, totp_pending, totp_last_step FROM users WHERE id = ?", userId,
  );
  const blob = which === "active" ? u?.totp_secret : u?.totp_pending;
  if (!u || !blob) return false;
  const step = verifyTotp(base32Decode(decryptSecret(blob)), code, Date.now(), u.totp_last_step);
  if (step === null) return false;
  // Conditional update: two requests racing with the same code can't both win.
  return Number(run("UPDATE users SET totp_last_step = ? WHERE id = ? AND totp_last_step < ?", step, userId, step).changes) === 1;
}

export function useRecoveryCode(userId: number, code: string): boolean {
  if (normalizeRecovery(code).length !== 8) return false;
  return Number(run("UPDATE recovery_codes SET used_at = datetime('now') WHERE user_id = ? AND code_hash = ? AND used_at IS NULL", userId, hashCode(code)).changes) === 1;
}

export function replaceRecoveryCodes(userId: number): string[] {
  const codes = newRecoveryCodes();
  tx(() => {
    run("DELETE FROM recovery_codes WHERE user_id = ?", userId);
    for (const c of codes) run("INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)", userId, hashCode(c));
  });
  return codes;
}

export function recoveryCodesLeft(userId: number): number {
  return one<{ n: number }>("SELECT COUNT(*) n FROM recovery_codes WHERE user_id = ? AND used_at IS NULL", userId)!.n;
}

export function staffWithout2fa(): { username: string }[] {
  return all("SELECT username FROM users WHERE role IN ('admin', 'staff') AND totp_enabled_at IS NULL");
}

export const requireStaff2fa = () => process.env.REQUIRE_STAFF_2FA === "1";

// ── Sign-in challenge: password passed, waiting for the code ─────────────

export const CHALLENGE_COOKIE = "kk_2fa";

export async function startChallenge(userId: number) {
  const email = one<{ email: string | null }>("SELECT email FROM users WHERE id = ?", userId)?.email ?? "";
  const token = issueToken(userId, "2fa", email, 10);
  (await cookies()).set(CHALLENGE_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
}

export async function pendingChallenge(): Promise<{ userId: number; token: string } | null> {
  const token = (await cookies()).get(CHALLENGE_COOKIE)?.value;
  const t = token ? peekToken(token, "2fa") : null;
  return t && token ? { userId: t.user_id, token } : null;
}

export async function finishChallenge(token: string): Promise<number | null> {
  const t = consumeToken(token, "2fa");
  (await cookies()).delete(CHALLENGE_COOKIE);
  return t?.user_id ?? null;
}
