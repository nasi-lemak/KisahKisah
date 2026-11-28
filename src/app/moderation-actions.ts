"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { run } from "@/lib/db";
import { limited, noteAttempt } from "@/lib/security";
import { minutes } from "@/lib/security-core";
import { fileReport, moderate, targetInfo, type ModAction } from "@/lib/moderation";
import { isReason, isTarget } from "@/lib/moderation-core";
import type { FormState } from "./actions";

export async function reportContent(type: string, id: number, form: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isTarget(type)) return { error: "Unknown content." };
  const reason = String(form.get("reason") ?? "");
  if (!isReason(reason)) return { error: "Pick a reason." };
  const info = targetInfo(type, Number(id));
  if (!info) return { error: "That's gone already." };
  if (info.authorId === user.id) return { error: "You can't report yourself. You can edit or delete it instead." };
  const gate = limited(`report:u:${user.id}`, 20, 60);
  if (gate.blocked) return { error: `You've sent a lot of reports. Try again in ${minutes(gate.retryAfterMs)}.` };
  noteAttempt(`report:u:${user.id}`);
  const r = fileReport(user.id, type, Number(id), reason, String(form.get("note") ?? "").trim().slice(0, 500));
  revalidatePath(info.url.split("#")[0]);
  return { ok: r === "duplicate" ? "You already reported this. Thanks!" : "Thanks. Our moderators will take a look." };
}

export async function toggleBlock(userId: number): Promise<{ blocked: boolean; error?: string }> {
  const user = await requireUser();
  if (userId === user.id) return { blocked: false, error: "You can't block yourself." };
  const removed = run("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?", user.id, userId).changes;
  if (!removed) {
    run("INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) VALUES (?, ?)", user.id, userId);
    // Blocking also ends following in both directions.
    run("DELETE FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)", user.id, userId, userId, user.id);
  }
  revalidatePath("/", "layout");
  return { blocked: !removed };
}

export async function moderateAction(type: string, id: number, form: FormData) {
  const staff = await requireStaff();
  const action = String(form.get("action") ?? "") as ModAction;
  if (!isTarget(type) || !["hide", "restore", "spoiler", "dismiss", "suspend", "unsuspend"].includes(action)) return;
  moderate(staff.id, type, Number(id), action, String(form.get("note") ?? "").trim().slice(0, 300));
  revalidatePath("/", "layout");
}
