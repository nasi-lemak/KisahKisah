"use server";

import { revalidatePath } from "next/cache";
import { currentUser, requireStaff } from "@/lib/auth";
import { run } from "@/lib/db";
import { today } from "@/lib/events";
import { runJobs } from "@/lib/jobs";
import { reminderState, targetInfo } from "@/lib/reminders";
import { canSignUp, inMarkets, parseTarget } from "@/lib/reminders-core";

export async function toggleReminder(target: string): Promise<{ on: boolean; count: number; error?: string }> {
  const user = await currentUser();
  const t = parseTarget(target);
  const info = t && targetInfo(t);
  if (!user) return { ...reminderState(null, target), error: "Sign in to get a reminder." };
  if (!info) return { on: false, count: 0, error: "Nothing to remind you about." };
  if (!canSignUp(info.date, today())) return { ...reminderState(user.id, target), error: "This is already out!" };
  if (!inMarkets(info.markets, user.home_country)) return { ...reminderState(user.id, target), error: "This release isn't coming to your country through KisahKisah." };
  const now = reminderState(user.id, target);
  if (now.on) run("DELETE FROM reminders WHERE user_id = ? AND target = ?", user.id, target);
  else run("INSERT OR IGNORE INTO reminders (user_id, target) VALUES (?, ?)", user.id, target);
  revalidatePath(info.url);
  return reminderState(user.id, target);
}

export async function runJobsNow(): Promise<{ ok?: string; error?: string }> {
  await requireStaff();
  const r = await runJobs();
  revalidatePath("/admin");
  return { ok: Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(" · ") };
}
