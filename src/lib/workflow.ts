/**
 * Review workflow shared by staff, partners and artists. Pure, so it's tested
 * and used by server actions and UI alike.
 *
 * Item:      draft ──submit──▶ submitted ──approve──▶ approved ──publish──▶ live ──retire──▶ retired
 *              ▲                   │                                         ▲               │
 *              └──request changes──┘                                         └───republish───┘
 */
import type { ItemType } from "./shop";
import type { SiteEvent } from "./events";

export type ItemStatus = "draft" | "submitted" | "approved" | "live" | "retired";
export type Actor = "staff" | "contributor";

const TRANSITIONS: Record<Actor, [ItemStatus, ItemStatus][]> = {
  contributor: [
    ["draft", "submitted"],
    ["submitted", "draft"], // withdraw to keep editing
  ],
  staff: [
    ["draft", "approved"], // staff-made items
    ["submitted", "approved"],
    ["submitted", "draft"], // request changes
    ["approved", "draft"],
    ["approved", "live"],
    ["live", "retired"],
    ["retired", "live"],
  ],
};

export function canTransition(from: ItemStatus, to: ItemStatus, actor: Actor): boolean {
  return TRANSITIONS[actor].some(([f, t]) => f === from && t === to);
}

/** Contributors can only change an item while it's a draft (theirs to work on). */
export function contributorCanEdit(status: ItemStatus): boolean {
  return status === "draft";
}

// ── Partner campaigns ────────────────────────────────────────────────

export type CampaignStatus = "brief" | "submitted" | "approved" | "scheduled" | "ended";

/** What each package includes, as upload slots the partner fills. */
export const PACKAGE_SLOTS: Record<string, { type: ItemType; label: string }[]> = {
  indie: [
    { type: "sticker", label: "Sticker 1" }, { type: "sticker", label: "Sticker 2" }, { type: "sticker", label: "Sticker 3" },
  ],
  trailer: [
    { type: "sticker", label: "Sticker 1" }, { type: "sticker", label: "Sticker 2" }, { type: "sticker", label: "Sticker 3" }, { type: "sticker", label: "Sticker 4" },
  ],
  premiere: [
    { type: "sticker", label: "Sticker 1" }, { type: "sticker", label: "Sticker 2" }, { type: "sticker", label: "Sticker 3" }, { type: "sticker", label: "Sticker 4" },
    { type: "theme", label: "Limited app theme" }, { type: "frame", label: "Premium avatar decoration" },
  ],
  blockbuster: [
    { type: "sticker", label: "Sticker 1" }, { type: "sticker", label: "Sticker 2" }, { type: "sticker", label: "Sticker 3" }, { type: "sticker", label: "Sticker 4" },
    { type: "theme", label: "Limited app theme" }, { type: "frame", label: "Premium avatar decoration" },
    { type: "avatar", label: "Legendary avatar" }, { type: "effect", label: "Profile effect" }, { type: "banner", label: "Profile banner" },
  ],
};

export function slotsFor(pkg: string) {
  return PACKAGE_SLOTS[pkg] ?? PACKAGE_SLOTS.premiere;
}

/** Can staff schedule this campaign? Everything must be filled, approved, licensed and dated. */
export function campaignReadiness(c: { starts_on: string | null; ends_on: string | null; licence_confirmed: number; title: string; tagline: string },
  items: { status: ItemStatus }[], slotCount: number): { label: string; pass: boolean }[] {
  return [
    { label: "Title and tagline", pass: c.title.trim().length > 1 && c.tagline.trim().length > 3 },
    { label: `All ${slotCount} items uploaded`, pass: items.length >= slotCount },
    { label: "Every item approved", pass: items.length > 0 && items.every((i) => i.status === "approved" || i.status === "live") },
    { label: "Licence & “Sponsored” label confirmed by the partner", pass: c.licence_confirmed === 1 },
    { label: "Start and end dates (end after start)", pass: !!c.starts_on && !!c.ends_on && c.ends_on >= c.starts_on },
  ];
}

export function campaignEventId(id: number) {
  return `cmp-${id}`;
}

/** A scheduled campaign becomes a sponsored event, labelled "Sponsored". */
export function campaignToEvent(c: {
  id: number; title: string; tagline: string; synopsis: string; release_date: string | null; motif: string; country: string;
  starts_on: string; ends_on: string; color1: string; color2: string; org_name: string; featured: string;
}): SiteEvent {
  return {
    id: campaignEventId(c.id), kind: "sponsored", name: c.title, icon: c.motif || "🎬",
    tagline: c.tagline, rule: { kind: "once", start: c.starts_on, end: c.ends_on }, colors: [c.color1, c.color2],
    sponsor: { name: c.org_name, disclosure: `Sponsored by ${c.org_name}` },
    promo: { title: c.title, tagline: c.tagline, motif: c.motif || "🎬", country: c.country, releaseDate: c.release_date ?? c.starts_on, synopsis: c.synopsis },
    offers: [], featured: c.featured ? c.featured.split(",").filter(Boolean) : [],
    blurb: `Limited drops for ${c.title}. Claim them before they're vaulted.`,
  };
}

// ── Artists ──────────────────────────────────────────────────────────

export type BriefStatus = "open" | "assigned" | "in_review" | "done" | "cancelled";

export function formatFee(amountCents: number, currency: string): string {
  return `${currency} ${(amountCents / 100).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
