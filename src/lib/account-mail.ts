import "server-only";
import { issueToken } from "./security";
import { sendMail } from "./mail";
import { siteUrl } from "./site";

export async function sendVerification(userId: number, email: string, name: string) {
  const token = issueToken(userId, "verify", email, 60 * 24 * 3);
  const url = `${await siteUrl()}/verify/${token}`;
  return sendMail({
    to: email,
    subject: "Confirm your email for KisahKisah",
    text: `Hi ${name},\n\nConfirm this address so you can reset your password and get release-day reminders:\n\n${url}\n\nThe link works for 3 days. If you didn't sign up, ignore this email.\n\nKisahKisah`,
  });
}

export async function sendReset(userId: number, email: string, name: string) {
  const token = issueToken(userId, "reset", email, 60);
  const url = `${await siteUrl()}/reset/${token}`;
  return sendMail({
    to: email,
    subject: "Reset your KisahKisah password",
    text: `Hi ${name},\n\nSomeone (hopefully you) asked to reset your password. Choose a new one here:\n\n${url}\n\nThe link works for 1 hour and only once. Resetting signs you out everywhere.\nIf you didn't ask, ignore this email: your password hasn't changed.\n\nKisahKisah`,
  });
}

export async function sendPasswordChanged(email: string, name: string) {
  return sendMail({
    to: email,
    subject: "Your KisahKisah password was changed",
    text: `Hi ${name},\n\nYour password was just changed and other devices were signed out.\nIf this wasn't you, reset your password now at ${await siteUrl()}/forgot and contact us.\n\nKisahKisah`,
  });
}
