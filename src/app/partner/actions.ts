"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { campaignById, campaignItems, isOrgMember, notifyStaff } from "@/lib/portal";
import { campaignEventId, slotsFor } from "@/lib/workflow";
import { COUNTRY_BY_CODE } from "@/lib/regions";
import { randomBytes } from "node:crypto";

type State = { error?: string; ok?: string } | undefined;

export async function joinOrg(token: string) {
  const user = await requireUser(`/partner/join/${token}`);
  const inv = one<{ org_id: number; used_by: number | null }>("SELECT org_id, used_by FROM org_invites WHERE token = ?", token);
  if (!inv) redirect("/partner?invite=invalid");
  if (inv.used_by && inv.used_by !== user.id) redirect("/partner?invite=used");
  run("INSERT OR IGNORE INTO org_members (org_id, user_id) VALUES (?,?)", inv.org_id, user.id);
  run("UPDATE org_invites SET used_by = ?, used_at = datetime('now') WHERE token = ? AND used_by IS NULL", user.id, token);
  notifyStaff("🤝", `${user.display_name} joined a partner team`);
  redirect("/partner");
}

function own(campaignId: number, userId: number) {
  const c = campaignById(campaignId);
  return c && isOrgMember(c.org_id, userId) ? c : null;
}

export async function updateCampaignBrief(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const c = own(Number(form.get("campaign_id")), user.id);
  if (!c) return { error: "Campaign not found." };
  if (c.status !== "brief") return { error: "The brief is locked while the KisahKisah team reviews it." };
  const s = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const hex = (k: string, d: string) => (/^#[0-9a-f]{6}$/i.test(s(k, 7)) ? s(k, 7) : d);
  const country = COUNTRY_BY_CODE[s("country", 2).toUpperCase()] ? s("country", 2).toUpperCase() : c.country;
  const date = (k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s(k, 10)) ? s(k, 10) : null);
  if (!s("title", 120)) return { error: "The title can't be empty." };
  const markets = form.getAll("markets").map(String).filter((m) => m === "GLOBAL" || COUNTRY_BY_CODE[m]);
  if (!markets.length) return { error: "Pick at least one market (or Global)." };
  const filmSlug = s("film_slug", 80) || null;
  if (filmSlug && !one("SELECT 1 x FROM films WHERE slug = ?", filmSlug)) return { error: "That title isn't on KisahKisah yet. Leave it empty and ask us to add it." };
  run(
    `UPDATE campaigns SET title = ?, tagline = ?, synopsis = ?, release_date = ?, motif = ?, country = ?, color1 = ?, color2 = ?,
       starts_on = ?, ends_on = ?, markets = ?, film_slug = ?, updated_at = datetime('now') WHERE id = ?`,
    s("title", 120), s("tagline", 140), s("synopsis", 600), date("release_date"), s("motif", 8) || "🎬", country,
    hex("color1", c.color1), hex("color2", c.color2), date("starts_on"), date("ends_on"), markets.includes("GLOBAL") ? "GLOBAL" : markets.join(","), filmSlug, c.id,
  );
  revalidatePath(`/partner/campaigns/${c.id}`);
  return { ok: "Brief saved." };
}

/** Start an upload slot from the package (e.g. "Sticker 2") and open it in the editor. */
export async function startSlot(campaignId: number, slot: number) {
  const user = await requireUser();
  const c = own(campaignId, user.id);
  if (!c || c.status !== "brief") return;
  const def = slotsFor(c.package)[slot];
  if (!def) return;
  const label = `${slot}`;
  const existing = one<{ id: string }>("SELECT id FROM custom_items WHERE campaign_id = ? AND slot = ?", campaignId, label);
  if (existing) redirect(`/contribute/items/${existing.id}`);
  const id = `ci_${randomBytes(5).toString("hex")}`;
  run(
    `INSERT INTO custom_items (id, type, name, description, rarity, event, event_price, source, campaign_id, slot, artist, submitted_by, created_by)
     VALUES (?,?,?,?,?,?,?, 'partner', ?,?,?,?,?)`,
    id, def.type, `${c.title}: ${def.label}`, "", def.type === "frame" || def.type === "avatar" ? "legendary" : def.type === "sticker" ? "rare" : "epic",
    campaignEventId(campaignId), def.type === "frame" ? 150 : 0, campaignId, label, c.org_name, user.id, user.id,
  );
  redirect(`/contribute/items/${id}`);
}

/** Partner confirms licensing + disclosure and hands the campaign to the team. */
export async function submitCampaign(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const c = own(Number(form.get("campaign_id")), user.id);
  if (!c) return { error: "Campaign not found." };
  if (form.get("licence") !== "on" || form.get("disclosure") !== "on") return { error: "Please confirm both statements." };
  const items = campaignItems(c.id);
  const slots = slotsFor(c.package).length;
  if (items.length < slots) return { error: `Upload all ${slots} items first (${items.length} so far).` };
  if (items.some((i) => i.status === "draft")) return { error: "Submit every item for review first." };
  if (!c.tagline.trim() || !c.starts_on || !c.ends_on) return { error: "Fill in the tagline and your preferred dates." };
  run("UPDATE campaigns SET status = 'submitted', licence_confirmed = 1, licence_by = ?, licence_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", user.id, c.id);
  notifyStaff("📦", `Campaign submitted: ${c.title}`, c.org_name);
  revalidatePath(`/partner/campaigns/${c.id}`);
  return { ok: "Submitted! The KisahKisah team will review it and schedule it." };
}
