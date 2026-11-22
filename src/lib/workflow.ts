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
  starts_on: string; ends_on: string; color1: string; color2: string; org_name: string; featured: string; markets?: string;
}): SiteEvent {
  const markets = (c.markets ?? "").split(",").map((m) => m.trim().toUpperCase()).filter((m) => /^[A-Z]{2}$|^GLOBAL$/.test(m));
  return {
    id: campaignEventId(c.id), kind: "sponsored", name: c.title, icon: c.motif || "🎬",
    tagline: c.tagline, rule: { kind: "once", start: c.starts_on, end: c.ends_on }, colors: [c.color1, c.color2],
    sponsor: { name: c.org_name, disclosure: `Sponsored by ${c.org_name}` },
    promo: { title: c.title, tagline: c.tagline, motif: c.motif || "🎬", country: c.country, releaseDate: c.release_date ?? c.starts_on, synopsis: c.synopsis },
    offers: [], featured: c.featured ? c.featured.split(",").filter(Boolean) : [],
    blurb: `Limited drops for ${c.title}. Claim them before they're vaulted.`,
    markets: markets.length && !markets.includes("GLOBAL") ? markets : undefined,
  };
}

// ── Artists ──────────────────────────────────────────────────────────

export type BriefStatus = "open" | "assigned" | "in_review" | "done" | "cancelled";

export function formatFee(amountCents: number, currency: string): string {
  return `${currency} ${(amountCents / 100).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// ── House events created in the admin ────────────────────────────────

export type HouseEventRow = {
  id: string; name: string; icon: string; tagline: string; blurb: string; color1: string; color2: string;
  repeat: "yearly" | "once"; starts: string; ends: string; bonus_points: number; bonus_max: number;
  bonus_genres: string; bonus_countries: string; featured: string; markets: string; enabled: number;
};

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function bonusLabel(genres: string[], countries: string[], countryName: (c: string) => string = (c) => c): string {
  const parts = [
    ...(genres.length ? [`${genres.map((g) => g.toLowerCase()).join(" or ")} title`] : []),
    ...(countries.length ? [`title from ${countries.map(countryName).join(" or ")}`] : []),
  ];
  return parts.length ? `Log a ${parts.join(", or a ")}` : "";
}

export function houseToEvent(r: HouseEventRow, countryName?: (c: string) => string): SiteEvent {
  const genres = list(r.bonus_genres);
  const countries = list(r.bonus_countries);
  const markets = list(r.markets);
  return {
    id: r.id, kind: "house", name: r.name, icon: r.icon || "🎉", tagline: r.tagline, blurb: r.blurb,
    rule: r.repeat === "yearly" ? { kind: "fixed", start: r.starts, end: r.ends } : { kind: "once", start: r.starts, end: r.ends },
    colors: [r.color1, r.color2], offers: [],
    bonus: r.bonus_points > 0 && (genres.length || countries.length)
      ? { label: bonusLabel(genres, countries, countryName), points: r.bonus_points, maxLogs: r.bonus_max, genres, countries }
      : undefined,
    featured: list(r.featured),
    markets: markets.length && !markets.includes("GLOBAL") ? markets : undefined,
  };
}

const MMDD = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const YMD = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function realDate(ymd: string): boolean {
  const t = Date.parse(`${ymd}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === ymd;
}

/** Problems with an event's schedule, or [] if it's fine. Yearly events may wrap the new year. */
export function validateSchedule(repeat: string, starts: string, ends: string): string[] {
  if (repeat === "yearly") {
    const ok = (d: string) => MMDD.test(d) && realDate(`2024-${d}`); // leap year allows 02-29
    return [
      ...(ok(starts) ? [] : ["Start must be a month and day."]),
      ...(ok(ends) ? [] : ["End must be a month and day."]),
    ];
  }
  if (repeat === "once") {
    if (!YMD.test(starts) || !realDate(starts) || !YMD.test(ends) || !realDate(ends)) return ["Pick real start and end dates."];
    return ends < starts ? ["The end date is before the start date."] : [];
  }
  return ["Choose yearly or one-off."];
}

export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "event";
}
