"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { all, one, run } from "@/lib/db";
import { readiness, type CustomData, type Draft } from "@/lib/custom-item-map";
import { syncCustomItems, type CustomItemRow } from "@/lib/custom-items";
import { validateGradient, validateTheme } from "@/lib/asset-spec";
import { eventById } from "@/lib/events";
import type { ItemType, Rarity } from "@/lib/shop";
import { canTransition, campaignReadiness, campaignEventId, slotsFor, slugify, validateSchedule, type ItemStatus } from "@/lib/workflow";
import { GENRES } from "@/lib/catalog";
import { COUNTRY_BY_CODE } from "@/lib/regions";

const GENRE_LIST: string[] = [...GENRES];
import { addItemComment, campaignById, campaignItems, notifyContributors, orgMembers, snapshotVersion } from "@/lib/portal";
import { notify } from "@/lib/rewards";
import { redirect } from "next/navigation";

const TYPES: ItemType[] = ["avatar", "frame", "effect", "namestyle", "banner", "sticker", "theme", "title"];
const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];
const ANIMS = ["bounce", "wobble", "spin", "pulse", "float", "shake"];
const MOTIONS = ["fall", "rise", "drift", "streak", "twinkle"];

export type SaveInput = {
  id?: string; type: string; name: string; description: string; rarity: string; price: number | null;
  event: string | null; event_price: number | null; asset_key: string | null; artist: string; notes: string; data: CustomData;
};

function cleanData(type: ItemType, d: CustomData): CustomData {
  const hex = (x: unknown) => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x);
  switch (type) {
    case "sticker":
      return { anim: ANIMS.includes(d.anim ?? "") ? d.anim : undefined };
    case "effect":
      return {
        particles: (d.particles ?? []).map((p) => String(p).slice(0, 8)).filter(Boolean).slice(0, 4),
        motion: MOTIONS.includes(d.motion ?? "") ? d.motion : "fall",
      };
    case "theme":
      return { theme: Object.fromEntries(Object.entries(d.theme ?? {}).filter(([k, v]) => /^[a-z]+$/.test(k) && hex(v))) };
    case "namestyle":
      return { gradient: (d.gradient ?? []).filter(hex).slice(0, 4), shimmer: !!d.shimmer };
    case "title":
      return { text: String(d.text ?? "").slice(0, 40) };
    default:
      return {};
  }
}

function colourOk(type: ItemType, d: CustomData) {
  if (type === "theme") return validateTheme(d.theme ?? {}).ok;
  if (type === "namestyle") return validateGradient(d.gradient ?? []).ok;
  return true;
}

function assetOk(key: string | null): boolean {
  if (!key) return false;
  const a = one<{ checks: string }>("SELECT checks FROM assets WHERE key = ?", key);
  try {
    return !!a && JSON.parse(a.checks).ok === true;
  } catch {
    return false;
  }
}

export async function saveCustomItem(input: SaveInput): Promise<{ id?: string; error?: string }> {
  const user = await requireStaff();
  const type = input.type as ItemType;
  if (!TYPES.includes(type)) return { error: "Pick an item type." };
  const rarity = RARITIES.includes(input.rarity as Rarity) ? input.rarity : "rare";
  if (!input.name.trim()) return { error: "Give the item a name." };
  const campaignEvent = input.event?.startsWith("cmp-") && one("SELECT 1 x FROM campaigns WHERE id = ?", Number(input.event.slice(4)));
  if (input.event && !eventById(input.event) && !campaignEvent) return { error: "Unknown event." };
  if (input.asset_key && !one("SELECT 1 x FROM assets WHERE key = ?", input.asset_key)) return { error: "That upload wasn't found. Upload again." };
  const price = input.price !== null && Number.isFinite(input.price) && input.price > 0 ? Math.round(Math.min(input.price, 100_000)) : null;
  const eventPrice = input.event ? Math.max(0, Math.round(Math.min(input.event_price ?? 0, 100_000))) : null;
  const data = JSON.stringify(cleanData(type, input.data));
  const fields = [type, input.name.trim().slice(0, 60), input.description.trim().slice(0, 240), rarity, price, input.event || null, eventPrice, input.asset_key, data, input.artist.trim().slice(0, 80), input.notes.slice(0, 2000)];

  if (input.id) {
    const existing = one<{ status: string }>("SELECT status FROM custom_items WHERE id = ?", input.id);
    if (!existing) return { error: "Item not found." };
    // Editing a live item takes it back to review, so nothing unchecked reaches the shop.
    const status = existing.status === "live" || existing.status === "approved" ? "draft" : existing.status;
    snapshotVersion(input.id, user.id);
    run(
      "UPDATE custom_items SET type=?, name=?, description=?, rarity=?, price=?, event=?, event_price=?, asset_key=?, data=?, artist=?, notes=?, status=?, updated_at=datetime('now') WHERE id = ?",
      ...fields, status, input.id,
    );
    syncCustomItems();
    revalidatePath("/", "layout");
    return { id: input.id };
  }
  const id = `ci_${randomBytes(5).toString("hex")}`;
  run(
    "INSERT INTO custom_items (type, name, description, rarity, price, event, event_price, asset_key, data, artist, notes, id, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ...fields, id, user.id,
  );
  return { id };
}

export async function setItemStatus(id: string, status: ItemStatus, note = ""): Promise<{ ok?: boolean; error?: string }> {
  const user = await requireStaff();
  const r = one<CustomItemRow>("SELECT * FROM custom_items WHERE id = ?", id);
  if (!r) return { error: "Item not found." };
  if (!canTransition(r.status, status, "staff")) return { error: `Can't go from ${r.status} to ${status}.` };
  if (status === "approved" || status === "live") {
    const data = JSON.parse(r.data) as CustomData;
    const d: Draft = { type: r.type, name: r.name, description: r.description, price: r.price, event: r.event, event_price: r.event_price, asset_key: r.asset_key, assetOk: assetOk(r.asset_key), data };
    const failing = readiness(d, colourOk(r.type, data)).filter((c) => !c.pass);
    if (failing.length) return { error: `Not ready: ${failing.map((f) => f.label.toLowerCase()).join("; ")}.` };
  }
  if (status === "draft" && r.status === "submitted" && !note.trim()) return { error: "Say what needs changing, so the contributor knows what to fix." };
  run(
    `UPDATE custom_items SET status = ?, updated_at = datetime('now')${status === "live" ? ", published_at = COALESCE(published_at, datetime('now'))" : ""} WHERE id = ?`,
    status, id,
  );
  const msg = { approved: "Approved", live: "Published: it's live", retired: "Retired to the vault", draft: "Changes requested", submitted: "Submitted" }[status];
  addItemComment(id, user.id, status === "draft" ? "changes" : status, note.trim() ? `${msg}: ${note.trim()}` : msg);
  if (r.source !== "staff") notifyContributors(r, status === "draft" ? "✏️" : status === "live" ? "🚀" : "✅", `${r.name}: ${msg.toLowerCase()}`, note.slice(0, 100));
  syncCustomItems();
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Partner campaigns ────────────────────────────────────────────────

/** Turn an Advertise inquiry into a partner org, a campaign and an invite link. */
export async function createPartnerFromInquiry(inquiryId: number) {
  const user = await requireStaff();
  const q = one<{ company: string; title: string; package: string; markets: string; release_date: string | null }>("SELECT * FROM ad_inquiries WHERE id = ?", inquiryId);
  if (!q) return;
  const existing = one<{ id: number }>("SELECT id FROM campaigns WHERE inquiry_id = ?", inquiryId);
  if (existing) redirect(`/admin/campaigns/${existing.id}`);
  const org = one<{ id: number }>("SELECT id FROM orgs WHERE name = ?", q.company) ?? { id: Number(run("INSERT INTO orgs (name) VALUES (?)", q.company).lastInsertRowid) };
  const pkg = ["indie", "trailer", "premiere", "blockbuster"].includes(q.package) ? q.package : "premiere";
  const cid = Number(
    run("INSERT INTO campaigns (org_id, inquiry_id, title, package, markets, release_date) VALUES (?,?,?,?,?,?)", org.id, inquiryId, q.title, pkg, q.markets, q.release_date).lastInsertRowid,
  );
  run("INSERT INTO org_invites (token, org_id, created_by) VALUES (?,?,?)", randomBytes(12).toString("base64url"), org.id, user.id);
  redirect(`/admin/campaigns/${cid}`);
}

export async function createInvite(orgId: number) {
  const user = await requireStaff();
  run("INSERT INTO org_invites (token, org_id, created_by) VALUES (?,?,?)", randomBytes(12).toString("base64url"), orgId, user.id);
  revalidatePath("/admin/campaigns");
}

/** Publish every item and run the campaign as a sponsored event between the dates. */
export async function scheduleCampaign(_: { error?: string; ok?: string } | undefined, form: FormData): Promise<{ error?: string; ok?: string }> {
  await requireStaff();
  const id = Number(form.get("campaign_id"));
  const c = campaignById(id);
  if (!c) return { error: "Campaign not found." };
  const starts = String(form.get("starts_on") ?? "");
  const ends = String(form.get("ends_on") ?? "");
  const featured = String(form.get("featured") ?? "").split(/[\s,]+/).filter((s) => /^[a-z0-9-]+$/.test(s)).slice(0, 6).join(",");
  run("UPDATE campaigns SET starts_on = ?, ends_on = ?, featured = ?, updated_at = datetime('now') WHERE id = ?", starts || null, ends || null, featured, id);
  const items = campaignItems(id);
  const fresh = campaignById(id)!;
  const failing = campaignReadiness(fresh, items, slotsFor(c.package).length).filter((x) => !x.pass);
  if (failing.length) return { error: `Not ready: ${failing.map((f) => f.label.toLowerCase()).join("; ")}.` };
  run("UPDATE custom_items SET status = 'live', event = ?, published_at = COALESCE(published_at, datetime('now')) WHERE campaign_id = ? AND status = 'approved'", campaignEventId(id), id);
  run("UPDATE campaigns SET status = 'scheduled', updated_at = datetime('now') WHERE id = ?", id);
  for (const m of orgMembers(c.org_id)) notify(m.id, "campaign", "📅", `${c.title} is scheduled`, `Live from ${starts} to ${ends}.`);
  syncCustomItems();
  revalidatePath("/", "layout");
  return { ok: `Scheduled: live ${starts} → ${ends}.` };
}

export async function returnCampaign(id: number, note: string) {
  await requireStaff();
  const c = campaignById(id);
  if (!c) return;
  run("UPDATE campaigns SET status = 'brief', licence_confirmed = 0, updated_at = datetime('now') WHERE id = ?", id);
  for (const m of orgMembers(c.org_id)) notify(m.id, "campaign", "✏️", `${c.title}: changes requested`, note.slice(0, 120));
  revalidatePath(`/admin/campaigns/${id}`);
}

// ── Artists & briefs ─────────────────────────────────────────────────

export async function reviewArtist(userId: number, decision: "approved" | "rejected") {
  const staff = await requireStaff();
  run("UPDATE artist_profiles SET status = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE user_id = ?", decision, staff.id, userId);
  notify(userId, "artist", decision === "approved" ? "🎨" : "📭", decision === "approved" ? "You're in! Welcome to the KisahKisah artist programme" : "Your artist application wasn't accepted this time", decision === "approved" ? "Open briefs are waiting for you." : "");
  revalidatePath("/admin/artists");
}

export async function createBrief(_: { error?: string; ok?: string } | undefined, form: FormData): Promise<{ error?: string; ok?: string }> {
  const staff = await requireStaff();
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const type = String(form.get("item_type") ?? "");
  const fee = Math.round(Number(form.get("fee")) * 100);
  const currency = String(form.get("currency") ?? "USD").toUpperCase().slice(0, 3);
  const quantity = Math.max(1, Math.min(12, Number(form.get("quantity")) || 1));
  const event = String(form.get("event") ?? "") || null;
  if (!title) return { error: "Give the brief a title." };
  if (!TYPES.includes(type as ItemType)) return { error: "Pick an item type." };
  if (!Number.isFinite(fee) || fee <= 0) return { error: "Set a fee." };
  if (event && !eventById(event)) return { error: "Unknown event." };
  run(
    "INSERT INTO briefs (title, description, item_type, quantity, fee_amount, fee_currency, due_on, event, created_by) VALUES (?,?,?,?,?,?,?,?,?)",
    title, String(form.get("description") ?? "").slice(0, 3000), type, quantity, fee, currency, String(form.get("due_on") ?? "") || null, event, staff.id,
  );
  for (const a of all<{ user_id: number }>("SELECT user_id FROM artist_profiles WHERE status = 'approved'")) notify(a.user_id, "brief", "🖌️", `New brief: ${title}`, `${quantity} × ${type}`);
  revalidatePath("/admin/briefs");
  return { ok: "Brief posted. Approved artists have been notified." };
}

/** Accept the work: brief done, fee owed. */
export async function completeBrief(id: number) {
  await requireStaff();
  const b = one<{ assigned_to: number | null; fee_amount: number; fee_currency: string; title: string; status: string }>("SELECT * FROM briefs WHERE id = ?", id);
  if (!b?.assigned_to || b.status === "done") return;
  run("UPDATE briefs SET status = 'done', completed_at = datetime('now') WHERE id = ?", id);
  run("INSERT OR IGNORE INTO payouts (brief_id, user_id, amount, currency) VALUES (?,?,?,?)", id, b.assigned_to, b.fee_amount, b.fee_currency);
  notify(b.assigned_to, "brief", "💸", `Brief accepted: ${b.title}`, "Your fee is queued for payment.");
  revalidatePath("/admin/briefs");
}

export async function cancelBrief(id: number) {
  await requireStaff();
  run("UPDATE briefs SET status = 'cancelled' WHERE id = ? AND status IN ('open', 'assigned')", id);
  revalidatePath("/admin/briefs");
}

export async function markPayoutPaid(id: number, reference: string) {
  await requireStaff();
  const p = one<{ user_id: number; amount: number; currency: string }>("SELECT * FROM payouts WHERE id = ? AND status = 'pending'", id);
  if (!p) return;
  run("UPDATE payouts SET status = 'paid', paid_at = datetime('now'), reference = ? WHERE id = ?", reference.slice(0, 80), id);
  notify(p.user_id, "brief", "✅", "Payment sent", `${p.currency} ${(p.amount / 100).toFixed(2)}${reference ? ` · ref ${reference}` : ""}`);
  revalidatePath("/admin/artists");
}

// ── House events (seasonal calendar) ─────────────────────────────────

export async function saveHouseEvent(_: { error?: string; ok?: string } | undefined, form: FormData): Promise<{ error?: string; ok?: string }> {
  await requireStaff();
  const s = (k: string, max = 200) => String(form.get(k) ?? "").trim().slice(0, max);
  const name = s("name", 60);
  if (!name) return { error: "Give the event a name." };
  const repeat = s("repeat") === "once" ? "once" : "yearly";
  const rawStart = s("starts", 10);
  const rawEnd = s("ends", 10);
  // Yearly events are stored as month-day; the form sends full dates.
  const starts = repeat === "yearly" && rawStart.length === 10 ? rawStart.slice(5) : rawStart;
  const ends = repeat === "yearly" && rawEnd.length === 10 ? rawEnd.slice(5) : rawEnd;
  const problems = validateSchedule(repeat, starts, ends);
  if (problems.length) return { error: problems.join(" ") };
  const hex = (k: string, d: string) => (/^#[0-9a-f]{6}$/i.test(s(k, 7)) ? s(k, 7) : d);
  const genres = form.getAll("bonus_genres").map(String).filter((g) => GENRE_LIST.includes(g)).join(",");
  const countries = form.getAll("bonus_countries").map(String).filter((c) => COUNTRY_BY_CODE[c]).join(",");
  const markets = form.getAll("markets").map(String).filter((c) => c === "GLOBAL" || COUNTRY_BY_CODE[c]);
  const featured = s("featured", 400).split(/[\s,]+/).filter((x) => /^[a-z0-9-]+$/.test(x)).slice(0, 8).join(",");
  const points = Math.max(0, Math.min(100, Math.round(Number(form.get("bonus_points")) || 0)));
  const maxLogs = Math.max(1, Math.min(10, Math.round(Number(form.get("bonus_max")) || 3)));
  const fields = [name, s("icon", 8) || "🎉", s("tagline", 140), s("blurb", 600), hex("color1", "#f5a524"), hex("color2", "#19b38a"), repeat, starts, ends, points, maxLogs, genres, countries, featured, markets.includes("GLOBAL") ? "" : markets.join(","), form.get("enabled") === "on" ? 1 : 0];
  let id = s("id", 60);
  if (id) {
    if (!one("SELECT 1 x FROM house_events WHERE id = ?", id)) return { error: "Event not found." };
    run(
      `UPDATE house_events SET name=?, icon=?, tagline=?, blurb=?, color1=?, color2=?, repeat=?, starts=?, ends=?, bonus_points=?, bonus_max=?,
         bonus_genres=?, bonus_countries=?, featured=?, markets=?, enabled=?, updated_at=datetime('now') WHERE id = ?`,
      ...fields, id,
    );
  } else {
    id = `he-${slugify(name)}`;
    if (one("SELECT 1 x FROM house_events WHERE id = ?", id) || eventById(id)) id = `${id}-${randomBytes(2).toString("hex")}`;
    run(
      `INSERT INTO house_events (name, icon, tagline, blurb, color1, color2, repeat, starts, ends, bonus_points, bonus_max, bonus_genres, bonus_countries, featured, markets, enabled, id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ...fields, id,
    );
  }
  syncCustomItems();
  revalidatePath("/", "layout");
  redirect(`/admin/events/${id}?saved=1`);
}

// ── Campaign ticket bonus (commercial terms, staff only) ──────────────

export async function saveTicketBonus(_: { error?: string; ok?: string } | undefined, form: FormData): Promise<{ error?: string; ok?: string }> {
  await requireStaff();
  const id = Number(form.get("campaign_id"));
  if (!one("SELECT 1 x FROM campaigns WHERE id = ?", id)) return { error: "Campaign not found." };
  const filmSlug = String(form.get("film_slug") ?? "").trim() || null;
  if (filmSlug && !one("SELECT 1 x FROM films WHERE slug = ?", filmSlug)) return { error: "No catalogue title with that slug." };
  const pct = Math.max(0, Math.min(300, Math.round(Number(form.get("ticket_bonus_pct")) || 0)));
  const item = String(form.get("ticket_item") ?? "") || null;
  if (item && !one("SELECT 1 x FROM custom_items WHERE id = ? AND campaign_id = ?", item, id)) return { error: "Pick one of this campaign's items." };
  if ((pct || item) && !filmSlug) return { error: "Link the catalogue title first: the bonus applies to tickets for that title." };
  run("UPDATE campaigns SET film_slug = ?, ticket_bonus_pct = ?, ticket_item = ?, updated_at = datetime('now') WHERE id = ?", filmSlug, pct, item, id);
  syncCustomItems();
  revalidatePath("/", "layout");
  return { ok: pct || item ? `Saved: +${pct}% KP${item ? " and the item" : ""} on partner-cinema tickets during the campaign.` : "Saved. No ticket bonus." };
}
