import "server-only";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { all, one, run } from "./db";
import { hashToken, throttle } from "./security-core";

/**
 * The client's IP, or null when we can't know it. X-Forwarded-For is only trusted behind
 * a proxy you control (TRUST_PROXY=1). Without one, per-IP limits are skipped rather than
 * putting every visitor in one bucket (which would let one attacker lock everyone out).
 */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV !== "production") {
    const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip");
    if (ip) return ip.slice(0, 64);
  }
  return null;
}

/** Limit keyed by IP, or no limit when the IP is unknown. */
export function limitedByIp(prefix: string, ip: string | null, limit: number, windowMin: number) {
  return ip ? limited(`${prefix}:ip:${ip}`, limit, windowMin) : { blocked: false, retryAfterMs: 0 };
}

/** Blocked? Checks failures recorded under `key` within the window. */
export function limited(key: string, limit: number, windowMin: number): { blocked: boolean; retryAfterMs: number } {
  const since = new Date(Date.now() - windowMin * 60_000).toISOString();
  const rows = all<{ at: string }>("SELECT at FROM auth_attempts WHERE key = ? AND at > ? ORDER BY at DESC LIMIT ?", key, since, limit + 1);
  return throttle(rows.map((r) => Date.parse(r.at)), Date.now(), limit, windowMin * 60_000);
}

export function noteAttempt(...keys: (string | null)[]) {
  const at = new Date().toISOString();
  for (const k of keys) if (k) run("INSERT INTO auth_attempts (key, at) VALUES (?, ?)", k, at);
  // Keep the table small.
  if (Math.random() < 0.02) run("DELETE FROM auth_attempts WHERE at < ?", new Date(Date.now() - 86400_000).toISOString());
}

export function clearAttempts(key: string) {
  run("DELETE FROM auth_attempts WHERE key = ?", key);
}

export type TokenPurpose = "verify" | "reset" | "2fa";

/** One live token per user and purpose; issuing a new one cancels the old. */
export function issueToken(userId: number, purpose: TokenPurpose, email: string, ttlMin: number): string {
  const token = randomBytes(32).toString("base64url");
  run("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?", userId, purpose);
  run(
    "INSERT INTO auth_tokens (token_hash, user_id, purpose, email, expires_at) VALUES (?,?,?,?,?)",
    hashToken(token), userId, purpose, email, new Date(Date.now() + ttlMin * 60_000).toISOString(),
  );
  return token;
}

export type TokenRow = { user_id: number; email: string; expires_at: string; used_at: string | null };

/** Look a token up without using it (for showing the form). */
export function peekToken(token: string, purpose: TokenPurpose): TokenRow | null {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const r = one<TokenRow>("SELECT user_id, email, expires_at, used_at FROM auth_tokens WHERE token_hash = ? AND purpose = ?", hashToken(token), purpose);
  if (!r || r.used_at || r.expires_at < new Date().toISOString()) return null;
  return r;
}

/** Single use: marks the token used and returns it, or null if invalid/expired/used. */
export function consumeToken(token: string, purpose: TokenPurpose): TokenRow | null {
  const r = peekToken(token, purpose);
  if (!r) return null;
  const done = run("UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL", new Date().toISOString(), hashToken(token));
  return Number(done.changes) === 1 ? r : null;
}

/** Failed password checks for one account (sign-in, change email, change password). */
export const loginKey = (userId: number) => `login:id:${userId}`;

/** Check the current password for a sensitive change, with the same lockout as sign-in. */
export function checkCurrentPassword(userId: number, password: string, verify: (pw: string, hash: string) => boolean): { ok: true } | { ok: false; error: string } {
  const gate = limited(loginKey(userId), 5, 15);
  if (gate.blocked) return { ok: false, error: `Too many wrong passwords. Try again in ${Math.max(1, Math.ceil(gate.retryAfterMs / 60_000))} minutes.` };
  const row = one<{ h: string }>("SELECT password_hash h FROM users WHERE id = ?", userId);
  if (!row || !verify(password, row.h)) {
    noteAttempt(loginKey(userId));
    return { ok: false, error: "Your current password is wrong." };
  }
  return { ok: true };
}
