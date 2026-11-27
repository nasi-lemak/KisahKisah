"use server";

import QRCode from "qrcode";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, requireUser, revokeOtherSessions } from "@/lib/auth";
import { run } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { notify } from "@/lib/rewards";
import { sendMail } from "@/lib/mail";
import { checkCurrentPassword, limited, loginKey, noteAttempt } from "@/lib/security";
import { minutes } from "@/lib/security-core";
import { checkCode, encryptSecret, finishChallenge, pendingChallenge, recoveryCodesLeft, replaceRecoveryCodes, twoFactorEnabled, useRecoveryCode } from "@/lib/twofactor";
import { newSecret, otpauthUrl } from "@/lib/totp-core";
import type { FormState } from "./actions";

const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

/** Second step of sign-in: a code from the app, or a recovery code. */
export async function verifySignIn(_: FormState, form: FormData): Promise<FormState> {
  const ch = await pendingChallenge();
  if (!ch) return { error: "This sign-in has expired. Enter your password again." };
  const gate = limited(loginKey(ch.userId), 5, 15);
  if (gate.blocked) return { error: `Too many wrong codes. Try again in ${minutes(gate.retryAfterMs)}.` };
  const code = String(form.get("code") ?? "").trim();
  const viaApp = /^\d{6}$/.test(code.replace(/\s/g, "")) && checkCode(ch.userId, code);
  const viaRecovery = !viaApp && useRecoveryCode(ch.userId, code);
  if (!viaApp && !viaRecovery) {
    noteAttempt(loginKey(ch.userId));
    return { error: "That code didn't work. Codes change every 30 seconds; check your phone's clock is right." };
  }
  const userId = await finishChallenge(ch.token);
  if (!userId) return { error: "This sign-in has expired. Enter your password again." };
  if (viaRecovery) {
    const left = recoveryCodesLeft(userId);
    notify(userId, "security", "🔑", "A recovery code was used to sign in", `${left} left. If this wasn't you, change your password now.`);
  }
  await createSession(userId);
  redirect(safeNext(String(form.get("next") ?? "/")));
}

export type SetupState = { secret: string; qr: string; url: string } | { error: string } | null;

export async function startTwoFactorSetup(): Promise<SetupState> {
  const user = await requireUser("/settings");
  if (twoFactorEnabled(user.id)) return { error: "Two-step sign-in is already on." };
  const secret = newSecret();
  run("UPDATE users SET totp_pending = ? WHERE id = ?", encryptSecret(secret), user.id);
  const url = otpauthUrl(secret, user.username);
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#15171c", light: "#ffffff" } });
  return { secret, qr, url };
}

export type CodesState = { codes?: string[]; error?: string } | undefined;

export async function confirmTwoFactor(_: CodesState, form: FormData): Promise<CodesState> {
  const user = await requireUser("/settings");
  if (!checkCode(user.id, String(form.get("code") ?? ""), "pending")) return { error: "That code didn't match. Type the 6 digits your app shows now." };
  run("UPDATE users SET totp_secret = totp_pending, totp_pending = NULL, totp_enabled_at = datetime('now') WHERE id = ?", user.id);
  const codes = replaceRecoveryCodes(user.id);
  await revokeOtherSessions(user.id);
  if (user.email) await sendMail({ to: user.email, subject: "Two-step sign-in is on", text: `Hi ${user.display_name},\n\nTwo-step sign-in is now on for your KisahKisah account. Other devices were signed out.\nIf this wasn't you, reset your password and contact us.\n\nKisahKisah` });
  revalidatePath("/settings");
  return { codes };
}

export async function newRecoveryCodesAction(_: CodesState, form: FormData): Promise<CodesState> {
  const user = await requireUser("/settings");
  if (!checkCode(user.id, String(form.get("code") ?? ""))) return { error: "Enter a current code from your app to make new recovery codes." };
  return { codes: replaceRecoveryCodes(user.id) };
}

export async function disableTwoFactor(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/settings");
  if (process.env.REQUIRE_STAFF_2FA === "1" && (user.role === "staff" || user.role === "admin")) return { error: "Staff accounts must keep two-step sign-in on." };
  const pw = checkCurrentPassword(user.id, String(form.get("password") ?? ""), verifyPassword);
  if (!pw.ok) return { error: pw.error };
  const code = String(form.get("code") ?? "");
  if (!checkCode(user.id, code) && !useRecoveryCode(user.id, code)) return { error: "Enter a current code from your app (or a recovery code)." };
  run("UPDATE users SET totp_secret = NULL, totp_pending = NULL, totp_enabled_at = NULL, totp_last_step = -1 WHERE id = ?", user.id);
  run("DELETE FROM recovery_codes WHERE user_id = ?", user.id);
  if (user.email) await sendMail({ to: user.email, subject: "Two-step sign-in was turned off", text: `Hi ${user.display_name},\n\nTwo-step sign-in was just turned off for your KisahKisah account.\nIf this wasn't you, reset your password now.\n\nKisahKisah` });
  revalidatePath("/settings");
  return { ok: "Two-step sign-in is off." };
}
