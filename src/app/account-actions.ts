"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, requireUser, revokeAllSessions, revokeOtherSessions } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkCurrentPassword, clearAttempts, clientIp, consumeToken, limited, loginKey, noteAttempt, peekToken } from "@/lib/security";
import { minutes, normalizeEmail, passwordProblem, validEmail } from "@/lib/security-core";
import { sendPasswordChanged, sendReset, sendVerification } from "@/lib/account-mail";
import type { FormState } from "./actions";

const SENT = "If an account matches, we've emailed a reset link. It works for 1 hour.";

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const who = String(form.get("who") ?? "").trim().toLowerCase().slice(0, 254);
  if (!who) return { error: "Enter your username or email." };
  const ip = await clientIp();
  for (const [key, limit, win] of [[ip && `forgot:ip:${ip}`, 5, 15], [`forgot:who:${who}`, 3, 60]] as const) {
    if (!key) continue;
    const gate = limited(key, limit, win);
    if (gate.blocked) return { error: `Too many reset requests. Try again in ${minutes(gate.retryAfterMs)}.` };
  }
  noteAttempt(ip && `forgot:ip:${ip}`, `forgot:who:${who}`);
  const u = one<{ id: number; email: string | null; display_name: string }>(
    "SELECT id, email, display_name FROM users WHERE username = ? OR email = ? COLLATE NOCASE", who, who,
  );
  // Same answer whether or not the account exists, so this can't be used to find accounts.
  if (u?.email) await sendReset(u.id, u.email, u.display_name);
  return { ok: SENT };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  if (password !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const u0 = await peekUser(token);
  if (!u0) return { error: "This reset link has expired or was already used. Ask for a new one." };
  const problem = passwordProblem(password, u0.username);
  if (problem) return { error: problem };
  const t = consumeToken(token, "reset");
  if (!t) return { error: "This reset link has expired or was already used. Ask for a new one." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(password), t.user_id);
  // The link proved access to the inbox, so it also confirms the address.
  run("UPDATE users SET email_verified_at = COALESCE(email_verified_at, datetime('now')) WHERE id = ? AND email = ? COLLATE NOCASE", t.user_id, t.email);
  revokeAllSessions(t.user_id);
  clearAttempts(loginKey(t.user_id));
  await sendPasswordChanged(t.email, u0.display_name);
  await createSession(t.user_id);
  redirect("/settings?reset=1");
}

async function peekUser(token: string) {
  const t = peekToken(token, "reset");
  return t ? one<{ username: string; display_name: string }>("SELECT username, display_name FROM users WHERE id = ?", t.user_id) : undefined;
}

export async function resendVerification(): Promise<FormState> {
  const user = await requireUser("/settings");
  if (!user.email) return { error: "Add an email address first." };
  if (user.email_verified_at) return { ok: "Your email is already confirmed." };
  const gate = limited(`verify:u:${user.id}`, 3, 60);
  if (gate.blocked) return { error: `We've sent a few already. Try again in ${minutes(gate.retryAfterMs)}.` };
  noteAttempt(`verify:u:${user.id}`);
  await sendVerification(user.id, user.email, user.display_name);
  return { ok: `Sent. Check ${user.email}.` };
}

export async function changeEmail(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/settings");
  const email = normalizeEmail(String(form.get("email") ?? "").slice(0, 254));
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  const pw = checkCurrentPassword(user.id, String(form.get("password") ?? ""), verifyPassword);
  if (!pw.ok) return { error: pw.error };
  if (email === (user.email ?? "").toLowerCase()) return { ok: "That's already your email." };
  if (one("SELECT 1 x FROM users WHERE email = ? COLLATE NOCASE AND id != ?", email, user.id)) return { error: "Another account uses that email." };
  run("UPDATE users SET email = ?, email_verified_at = NULL WHERE id = ?", email, user.id);
  await sendVerification(user.id, email, user.display_name);
  revalidatePath("/settings");
  return { ok: `Saved. We sent a confirmation link to ${email}.` };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/settings");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  const pw = checkCurrentPassword(user.id, current, verifyPassword);
  if (!pw.ok) return { error: pw.error };
  if (next !== String(form.get("confirm") ?? "")) return { error: "The two new passwords don't match." };
  const problem = passwordProblem(next, user.username);
  if (problem) return { error: problem };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), user.id);
  await revokeOtherSessions(user.id);
  if (user.email) await sendPasswordChanged(user.email, user.display_name);
  return { ok: "Password changed. Other devices have been signed out." };
}

export async function signOutEverywhere() {
  const user = await requireUser("/settings");
  revokeAllSessions(user.id);
  await destroySession();
  redirect("/login");
}

export async function confirmEmail(token: string): Promise<FormState> {
  const t = consumeToken(token, "verify");
  if (!t) return { error: "This link has expired or was already used. Send a new one from Settings." };
  const done = run("UPDATE users SET email_verified_at = datetime('now') WHERE id = ? AND email = ? COLLATE NOCASE", t.user_id, t.email);
  if (Number(done.changes) !== 1) return { error: "Your email has changed since this link was sent. Use the newest link." };
  return { ok: `${t.email} is confirmed. Thanks!` };
}
