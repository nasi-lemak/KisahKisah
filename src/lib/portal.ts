import "server-only";
import { campaignSignups } from "./reminders";
import { all, one, run } from "./db";
import type { User } from "./auth";
import type { CustomItemRow } from "./custom-item-map";
import { notify } from "./rewards";
import { campaignEventId, type CampaignStatus, type BriefStatus } from "./workflow";

// ── Partners ─────────────────────────────────────────────────────────

export type Org = { id: number; name: string; created_at: string };
export type Campaign = {
  id: number; org_id: number; org_name: string; inquiry_id: number | null; title: string; package: string; markets: string;
  status: CampaignStatus; tagline: string; synopsis: string; release_date: string | null; motif: string; country: string;
  color1: string; color2: string; starts_on: string | null; ends_on: string | null; featured: string;
  licence_confirmed: number; licence_at: string | null; created_at: string; updated_at: string;
  film_slug: string | null; ticket_bonus_pct: number; ticket_item: string | null;
};

const CAMPAIGN_SELECT = "SELECT c.*, o.name org_name FROM campaigns c JOIN orgs o ON o.id = c.org_id";

export function orgsForUser(userId: number): Org[] {
  return all<Org>("SELECT o.* FROM org_members m JOIN orgs o ON o.id = m.org_id WHERE m.user_id = ? ORDER BY o.name", userId);
}

export function isOrgMember(orgId: number, userId: number): boolean {
  return !!one("SELECT 1 x FROM org_members WHERE org_id = ? AND user_id = ?", orgId, userId);
}

export function campaignById(id: number): Campaign | undefined {
  return one<Campaign>(`${CAMPAIGN_SELECT} WHERE c.id = ?`, id);
}

export function campaignsForUser(userId: number): Campaign[] {
  return all<Campaign>(`${CAMPAIGN_SELECT} WHERE c.org_id IN (SELECT org_id FROM org_members WHERE user_id = ?) ORDER BY c.updated_at DESC`, userId);
}

export function allCampaigns(): Campaign[] {
  return all<Campaign>(`${CAMPAIGN_SELECT} ORDER BY c.updated_at DESC`);
}

export function campaignItems(campaignId: number): CustomItemRow[] {
  return all<CustomItemRow>("SELECT * FROM custom_items WHERE campaign_id = ? ORDER BY slot, created_at", campaignId);
}

export function orgMembers(orgId: number): { id: number; username: string; display_name: string }[] {
  return all("SELECT u.id, u.username, u.display_name FROM org_members m JOIN users u ON u.id = m.user_id WHERE m.org_id = ?", orgId);
}

/** What the sponsor sees after (and during) a campaign. Impressions need tracking that isn't built yet. */
export function campaignReport(c: Campaign) {
  const items = campaignItems(c.id).filter((i) => i.status === "live" || i.status === "retired");
  const ids = items.map((i) => i.id);
  const inList = ids.length ? ids.map(() => "?").join(",") : "''";
  const n = (sql: string, ...p: (string | number)[]) => one<{ n: number }>(sql, ...p)?.n ?? 0;
  const eventId = campaignEventId(c.id);
  const perItem = items.map((i) => ({
    id: i.id, name: i.name, type: i.type,
    claims: n("SELECT COUNT(*) n FROM event_claims WHERE event_id = ? AND item_id = ?", eventId, i.id),
    owners: n("SELECT COUNT(*) n FROM inventory WHERE item_id = ?", i.id),
    equipped: n(
      `SELECT COUNT(*) n FROM users WHERE ? IN (avatar_item, frame_item, banner_item, title_item, theme_item, effect_item, namestyle_item)`,
      i.id,
    ),
    stickerUses: i.type === "sticker"
      ? n("SELECT COUNT(*) n FROM review_stickers WHERE sticker_id = ?", i.id) + n("SELECT COUNT(*) n FROM profile_stickers WHERE item_id = ?", i.id)
      : 0,
  }));
  const tickets = one<{ n: number; points: number; items: number; fans: number }>(
    "SELECT COUNT(*) n, COALESCE(SUM(points), 0) points, COUNT(item_id) items, COUNT(DISTINCT user_id) fans FROM campaign_ticket_bonuses WHERE campaign_id = ?", c.id,
  )!;
  const byChain = all<{ chain_id: string; n: number; points: number }>(
    "SELECT chain_id, COUNT(*) n, SUM(points) points FROM campaign_ticket_bonuses WHERE campaign_id = ? GROUP BY chain_id ORDER BY n DESC", c.id,
  );
  return {
    tickets, byChain, reminders: campaignSignups(c.id, c.film_slug),
    uniqueClaimers: n("SELECT COUNT(DISTINCT user_id) n FROM event_claims WHERE event_id = ?", eventId),
    totalClaims: perItem.reduce((a, x) => a + x.claims, 0),
    kpSpent: n("SELECT COALESCE(SUM(price), 0) n FROM event_claims WHERE event_id = ?", eventId),
    equippedNow: ids.length ? n(`SELECT COUNT(*) n FROM users WHERE avatar_item IN (${inList}) OR frame_item IN (${inList}) OR banner_item IN (${inList}) OR theme_item IN (${inList}) OR effect_item IN (${inList}) OR namestyle_item IN (${inList}) OR title_item IN (${inList})`, ...ids, ...ids, ...ids, ...ids, ...ids, ...ids, ...ids) : 0,
    perItem,
  };
}

// ── Artists ──────────────────────────────────────────────────────────

export type ArtistProfile = {
  user_id: number; portfolio_url: string; bio: string; specialities: string; payout_details: string;
  status: "applied" | "approved" | "rejected"; created_at: string; reviewed_at: string | null;
};

export function artistProfile(userId: number): ArtistProfile | undefined {
  return one<ArtistProfile>("SELECT * FROM artist_profiles WHERE user_id = ?", userId);
}

export function isApprovedArtist(userId: number): boolean {
  return artistProfile(userId)?.status === "approved";
}

export type Brief = {
  id: number; title: string; description: string; item_type: string; quantity: number; fee_amount: number; fee_currency: string;
  due_on: string | null; event: string | null; status: BriefStatus; assigned_to: number | null; assignee_name: string | null;
  assignee_username: string | null; created_at: string; claimed_at: string | null; completed_at: string | null;
};

const BRIEF_SELECT = "SELECT b.*, u.display_name assignee_name, u.username assignee_username FROM briefs b LEFT JOIN users u ON u.id = b.assigned_to";

export function briefById(id: number): Brief | undefined {
  return one<Brief>(`${BRIEF_SELECT} WHERE b.id = ?`, id);
}

export function openBriefs(): Brief[] {
  return all<Brief>(`${BRIEF_SELECT} WHERE b.status = 'open' ORDER BY COALESCE(b.due_on, '9999') ASC`);
}

export function briefsForArtist(userId: number): Brief[] {
  return all<Brief>(`${BRIEF_SELECT} WHERE b.assigned_to = ? ORDER BY b.claimed_at DESC`, userId);
}

export function allBriefs(): Brief[] {
  return all<Brief>(`${BRIEF_SELECT} ORDER BY b.created_at DESC`);
}

export function briefItems(briefId: number): CustomItemRow[] {
  return all<CustomItemRow>("SELECT * FROM custom_items WHERE brief_id = ? ORDER BY created_at", briefId);
}

// ── Shared: contributors, comments, versions ─────────────────────────

/** Partners (any org) and approved artists may upload artwork. */
export function isContributor(u: Pick<User, "id" | "role">): boolean {
  return u.role === "admin" || u.role === "staff" || orgsForUser(u.id).length > 0 || isApprovedArtist(u.id);
}

/** May this person work on this item (not staff)? */
export function canContribute(u: Pick<User, "id">, item: Pick<CustomItemRow, "campaign_id" | "brief_id" | "submitted_by">): boolean {
  if (item.campaign_id) {
    const c = one<{ org_id: number }>("SELECT org_id FROM campaigns WHERE id = ?", item.campaign_id);
    return !!c && isOrgMember(c.org_id, u.id);
  }
  if (item.brief_id) {
    const b = one<{ assigned_to: number | null }>("SELECT assigned_to FROM briefs WHERE id = ?", item.brief_id);
    return b?.assigned_to === u.id;
  }
  return false;
}

export type ItemComment = { id: number; kind: string; body: string; created_at: string; display_name: string; username: string; role: string };

export function itemComments(itemId: string): ItemComment[] {
  return all<ItemComment>(
    "SELECT c.id, c.kind, c.body, c.created_at, u.display_name, u.username, u.role FROM item_comments c JOIN users u ON u.id = c.user_id WHERE c.item_id = ? ORDER BY c.id",
    itemId,
  );
}

export function addItemComment(itemId: string, userId: number, kind: string, body: string) {
  run("INSERT INTO item_comments (item_id, user_id, kind, body) VALUES (?,?,?,?)", itemId, userId, kind, body.slice(0, 2000));
}

export function snapshotVersion(itemId: string, userId: number) {
  const r = one<{ asset_key: string | null; data: string }>("SELECT asset_key, data FROM custom_items WHERE id = ?", itemId);
  if (r) run("INSERT INTO item_versions (item_id, asset_key, data, created_by) VALUES (?,?,?,?)", itemId, r.asset_key, r.data, userId);
}

export function itemVersions(itemId: string): { id: number; asset_key: string | null; created_at: string; display_name: string }[] {
  return all("SELECT v.id, v.asset_key, v.created_at, u.display_name FROM item_versions v LEFT JOIN users u ON u.id = v.created_by WHERE v.item_id = ? ORDER BY v.id DESC", itemId);
}

export function notifyStaff(icon: string, title: string, body = "") {
  for (const s of all<{ id: number }>("SELECT id FROM users WHERE role IN ('admin', 'staff')")) notify(s.id, "staff", icon, title, body);
}

/** Who should hear about a change to this item (the people on its campaign or brief). */
export function notifyContributors(item: Pick<CustomItemRow, "campaign_id" | "brief_id" | "submitted_by">, icon: string, title: string, body = "") {
  const ids = new Set<number>();
  if (item.submitted_by) ids.add(item.submitted_by);
  if (item.campaign_id) {
    const c = one<{ org_id: number }>("SELECT org_id FROM campaigns WHERE id = ?", item.campaign_id);
    if (c) for (const m of all<{ user_id: number }>("SELECT user_id FROM org_members WHERE org_id = ?", c.org_id)) ids.add(m.user_id);
  }
  if (item.brief_id) {
    const b = one<{ assigned_to: number | null }>("SELECT assigned_to FROM briefs WHERE id = ?", item.brief_id);
    if (b?.assigned_to) ids.add(b.assigned_to);
  }
  for (const id of ids) notify(id, "review", icon, title, body);
}
