import "server-only";
import { all, one } from "./db";
import type { User } from "./auth";
import { levelFromXp } from "./levels";
import { lifetimePoints } from "./queries";
import { eventById } from "./events";
import { ITEM_BY_ID, RARITY_STYLE } from "./shop";
import { ACHIEVEMENT_BY_ID } from "./achievements";

export type Badge = { id: string; icon: string; label: string };

/** Everything a profile card (full, mini or preview) needs. Serializable. */
export type CardData = {
  username: string;
  display_name: string;
  bio: string;
  home_country: string;
  avatar_item: string;
  frame_item: string | null;
  banner_item: string | null;
  title_item: string | null;
  effect_item: string | null;
  namestyle_item: string | null;
  accent1: string | null;
  accent2: string | null;
  level: { level: number; into: number; need: number; pct: number };
  badges: Badge[];
  since: string;
};

export const SHOWCASES = {
  favorites: { label: "Favourite films", icon: "🎞️" },
  stickers: { label: "Sticker board", icon: "🏷️" },
  achievements: { label: "Rarest achievements", icon: "🏆" },
  collection: { label: "Collection", icon: "💎" },
  review: { label: "Featured review", icon: "📝" },
  stats: { label: "By the numbers", icon: "📊" },
} as const;
export type ShowcaseId = keyof typeof SHOWCASES;

export function parseShowcases(raw: string | null | undefined): ShowcaseId[] {
  try {
    const xs = JSON.parse(raw ?? "[]");
    if (Array.isArray(xs)) return xs.filter((x): x is ShowcaseId => typeof x === "string" && Object.hasOwn(SHOWCASES, x)).slice(0, 6);
  } catch {}
  return ["favorites", "stickers", "achievements"];
}

const ACH_BADGES: Record<string, string> = {
  kaki_wayang: "Kaki Wayang", critics_corner: "Critic", big_screen: "Big Screen Believer", globetrotter: "Globetrotter",
  one_community: "ASEAN Complete", arcade_legend: "Arcade Legend", egg_hunter: "Easter Egg Hunter", crowd_favourite: "Crowd Favourite",
};

export function badgesFor(user: Pick<User, "id" | "created_at">): Badge[] {
  const out: Badge[] = [];
  if (user.created_at < "2027-01-01") out.push({ id: "founder", icon: "🏛️", label: "Founding member" });
  const have = new Set(all<{ a: string }>("SELECT achievement_id a FROM user_achievements WHERE user_id = ?", user.id).map((r) => r.a));
  for (const [id, label] of Object.entries(ACH_BADGES)) {
    const a = ACHIEVEMENT_BY_ID[id];
    if (a && have.has(id)) out.push({ id, icon: a.icon, label });
  }
  for (const e of all<{ event_id: string; occurrence: string }>(
    "SELECT DISTINCT event_id, occurrence FROM event_claims WHERE user_id = ? ORDER BY occurrence DESC LIMIT 6",
    user.id,
  )) {
    const ev = eventById(e.event_id);
    if (ev) out.push({ id: `${e.event_id}@${e.occurrence}`, icon: ev.icon, label: `${ev.name} ${e.occurrence.slice(0, 4)}` });
  }
  return out.slice(0, 10);
}

export function cardData(u: User): CardData {
  return {
    username: u.username, display_name: u.display_name, bio: u.bio, home_country: u.home_country,
    avatar_item: u.avatar_item, frame_item: u.frame_item, banner_item: u.banner_item, title_item: u.title_item,
    effect_item: u.effect_item, namestyle_item: u.namestyle_item, accent1: u.accent1, accent2: u.accent2,
    level: levelFromXp(lifetimePoints(u.id)),
    badges: badgesFor(u),
    since: u.created_at.slice(0, 10),
  };
}

export type BoardSticker = { id?: number; item_id: string; x: number; y: number; rot: number; scale: number; z: number };

export function stickerBoard(userId: number): BoardSticker[] {
  return all<BoardSticker>("SELECT id, item_id, x, y, rot, scale, z FROM profile_stickers WHERE user_id = ? ORDER BY z, id", userId);
}

/** Achievements this user has, rarest first (share of members who have it). */
export function rarestAchievements(userId: number, limit = 6) {
  const total = one<{ n: number }>("SELECT COUNT(*) n FROM users")?.n || 1;
  return all<{ achievement_id: string; holders: number }>(
    `SELECT ua.achievement_id, (SELECT COUNT(*) FROM user_achievements x WHERE x.achievement_id = ua.achievement_id) holders
     FROM user_achievements ua WHERE ua.user_id = ? ORDER BY holders ASC, ua.unlocked_at DESC LIMIT ?`,
    userId, limit,
  )
    .map((r) => ({ ...r, a: ACHIEVEMENT_BY_ID[r.achievement_id], pct: Math.round((r.holders / total) * 100) }))
    .filter((r) => r.a);
}

const RANK = { legendary: 0, epic: 1, rare: 2, common: 3 } as const;

export function collectionHighlights(userId: number, limit = 6) {
  return all<{ item_id: string }>("SELECT item_id FROM inventory WHERE user_id = ?", userId)
    .map((r) => ITEM_BY_ID[r.item_id])
    .filter((i) => i && !i.starter && i.type !== "title")
    .sort((a, b) => RANK[a.rarity] - RANK[b.rarity] || (b.price ?? 9999) - (a.price ?? 9999))
    .slice(0, limit);
}

export function collectionCount(userId: number): { total: number; byRarity: Record<string, number> } {
  const items = all<{ item_id: string }>("SELECT item_id FROM inventory WHERE user_id = ?", userId).map((r) => ITEM_BY_ID[r.item_id]).filter(Boolean);
  const byRarity: Record<string, number> = {};
  for (const r of Object.keys(RARITY_STYLE)) byRarity[r] = items.filter((i) => i.rarity === r).length;
  return { total: items.length, byRarity };
}

export type Stamp = { code: string; first: { date: string; title: string; slug: string } | null; titles: number };

/** One stamp per country: the first title watched from there and how many since. */
export function passport(userId: number): Map<string, Stamp> {
  const rows = all<{ country: string; watched_on: string; title: string; slug: string; film_id: number }>(
    `SELECT f.country, l.watched_on, f.title, f.slug, f.id film_id FROM logs l JOIN films f ON f.id = l.film_id
     WHERE l.user_id = ? ORDER BY l.watched_on ASC, l.id ASC`,
    userId,
  );
  const out = new Map<string, Stamp>();
  const seen = new Map<string, Set<number>>();
  for (const r of rows) {
    if (!out.has(r.country)) out.set(r.country, { code: r.country, first: { date: r.watched_on, title: r.title, slug: r.slug }, titles: 0 });
    const s = seen.get(r.country) ?? new Set<number>();
    s.add(r.film_id);
    seen.set(r.country, s);
    out.get(r.country)!.titles = s.size;
  }
  return out;
}
