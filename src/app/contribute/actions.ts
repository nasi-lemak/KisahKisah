"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { readiness, type CustomData, type CustomItemRow, type Draft } from "@/lib/custom-item-map";
import { validateGradient, validateTheme } from "@/lib/asset-spec";
import { canTransition, contributorCanEdit } from "@/lib/workflow";
import { addItemComment, canContribute, notifyContributors, notifyStaff, snapshotVersion } from "@/lib/portal";

type Result = { ok?: boolean; error?: string };

function load(id: string) {
  return one<CustomItemRow>("SELECT * FROM custom_items WHERE id = ?", id);
}

function cleanData(type: string, d: CustomData): CustomData {
  const hex = (x: unknown) => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x);
  if (type === "sticker") return { anim: ["bounce", "wobble", "spin", "pulse", "float", "shake"].includes(d.anim ?? "") ? d.anim : undefined };
  if (type === "effect") return { particles: (d.particles ?? []).map((p) => String(p).slice(0, 8)).slice(0, 4), motion: ["fall", "rise", "drift", "streak", "twinkle"].includes(d.motion ?? "") ? d.motion : "fall" };
  if (type === "theme") return { theme: Object.fromEntries(Object.entries(d.theme ?? {}).filter(([k, v]) => /^[a-z]+$/.test(k) && hex(v))) };
  if (type === "namestyle") return { gradient: (d.gradient ?? []).filter(hex).slice(0, 4), shimmer: !!d.shimmer };
  if (type === "title") return { text: String(d.text ?? "").slice(0, 40) };
  return {};
}

/** Partners and artists save their own drafts (they can't set price, rarity or publish). */
export async function contributorSaveItem(input: { id: string; name: string; description: string; asset_key: string | null; data: CustomData }): Promise<Result> {
  const user = await requireUser();
  const item = load(input.id);
  if (!item || !canContribute(user, item)) return { error: "You can't edit this item." };
  if (!contributorCanEdit(item.status)) return { error: "This item is with the KisahKisah team. Withdraw it first to keep editing." };
  if (input.asset_key && input.asset_key !== item.asset_key) {
    const a = one<{ uploaded_by: number }>("SELECT uploaded_by FROM assets WHERE key = ?", input.asset_key);
    if (!a) return { error: "That upload wasn't found. Upload again." };
  }
  run(
    "UPDATE custom_items SET name = ?, description = ?, asset_key = ?, data = ?, updated_at = datetime('now') WHERE id = ?",
    input.name.trim().slice(0, 60) || item.name, input.description.trim().slice(0, 240), input.asset_key, JSON.stringify(cleanData(item.type, input.data)), item.id,
  );
  snapshotVersion(item.id, user.id);
  revalidatePath(`/contribute/items/${item.id}`);
  return { ok: true };
}

export async function submitItem(id: string): Promise<Result> {
  const user = await requireUser();
  const item = load(id);
  if (!item || !canContribute(user, item)) return { error: "You can't submit this item." };
  if (!canTransition(item.status, "submitted", "contributor")) return { error: `Items can only be submitted from draft (this one is ${item.status}).` };
  const data = JSON.parse(item.data) as CustomData;
  const assetOk = !!item.asset_key && !!one("SELECT 1 x FROM assets WHERE key = ? AND json_extract(checks, '$.ok') = 1", item.asset_key);
  const colours = item.type === "theme" ? validateTheme(data.theme ?? {}).ok : item.type === "namestyle" ? validateGradient(data.gradient ?? []).ok : true;
  const d: Draft = { type: item.type, name: item.name, description: item.description, price: 1, event: null, event_price: null, asset_key: item.asset_key, assetOk, data };
  const failing = readiness(d, colours).filter((c) => !c.pass);
  if (failing.length) return { error: `Not ready yet: ${failing.map((f) => f.label.toLowerCase()).join("; ")}.` };
  run("UPDATE custom_items SET status = 'submitted', submitted_by = ?, updated_at = datetime('now') WHERE id = ?", user.id, id);
  if (item.brief_id) run("UPDATE briefs SET status = 'in_review' WHERE id = ? AND status = 'assigned'", item.brief_id);
  addItemComment(id, user.id, "submitted", "Submitted for review.");
  notifyStaff("📥", `New submission: ${item.name}`, `From ${user.display_name}`);
  revalidatePath(`/contribute/items/${id}`);
  return { ok: true };
}

export async function withdrawItem(id: string): Promise<Result> {
  const user = await requireUser();
  const item = load(id);
  if (!item || !canContribute(user, item)) return { error: "You can't change this item." };
  if (!canTransition(item.status, "draft", "contributor")) return { error: "Only submitted items can be withdrawn." };
  run("UPDATE custom_items SET status = 'draft', updated_at = datetime('now') WHERE id = ?", id);
  addItemComment(id, user.id, "comment", "Withdrew the submission to make changes.");
  revalidatePath(`/contribute/items/${id}`);
  return { ok: true };
}

/** Anyone involved (staff or the item's contributors) can comment. */
export async function commentOnItem(id: string, body: string): Promise<Result> {
  const user = await requireUser();
  const item = load(id);
  const staff = user.role === "admin" || user.role === "staff";
  if (!item || (!staff && !canContribute(user, item))) return { error: "You can't comment here." };
  if (!body.trim()) return { error: "Write something first." };
  addItemComment(id, user.id, "comment", body.trim());
  if (staff) notifyContributors(item, "💬", `New comment on ${item.name}`, body.slice(0, 80));
  else notifyStaff("💬", `${user.display_name} commented on ${item.name}`, body.slice(0, 80));
  revalidatePath(`/contribute/items/${id}`);
  revalidatePath(`/admin/items/${id}`);
  return { ok: true };
}
