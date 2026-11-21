import "server-only";
import { all, one, run, tx } from "./db";
import { ACHIEVEMENT_BY_ID, ACHIEVEMENTS, satisfied, type Stats } from "./achievements";
import { ITEM_BY_ID } from "./shop";
import { SEA_CODES, regionOf } from "./regions";

/** Points awarded for everyday activity. */
export const POINTS = {
  welcome: 100,
  log: 5,
  review: 15,
  longReview: 10,
  likeReceived: 2,
  comment: 3,
  list: 10,
  dailyCheckin: 10,
  commentsPerDay: 5,
} as const;

export function notify(userId: number, kind: string, icon: string, title: string, body = "") {
  run("INSERT INTO notifications (user_id, kind, icon, title, body) VALUES (?,?,?,?,?)", userId, kind, icon, title, body);
}

/**
 * Add (or with a negative delta, spend) points. Idempotent per (reason, ref):
 * the same award can never be granted twice. Returns true if it applied.
 */
export function award(userId: number, delta: number, reason: string, ref: string, label: string, opts: { silent?: boolean } = {}): boolean {
  return tx(() => {
    const r = run(
      "INSERT OR IGNORE INTO points_ledger (user_id, delta, reason, ref, label) VALUES (?,?,?,?,?)",
      userId, delta, reason, ref, label,
    );
    if (r.changes === 0) return false;
    run("UPDATE users SET points = points + ? WHERE id = ?", delta, userId);
    if (!opts.silent && delta > 0) notify(userId, "points", "🪙", `+${delta} KP`, label);
    return true;
  });
}

export function grantItem(userId: number, itemId: string, source: string): boolean {
  if (!ITEM_BY_ID[itemId]) return false;
  const r = run("INSERT OR IGNORE INTO inventory (user_id, item_id, source) VALUES (?,?,?)", userId, itemId, source);
  return r.changes > 0;
}

export function computeStats(userId: number): Stats {
  const logged = all<{ slug: string; country: string; year: number; genres: string; kind: string }>(
    "SELECT DISTINCT f.slug, f.country, f.year, f.genres, f.kind FROM logs l JOIN films f ON f.id = l.film_id WHERE l.user_id = ?",
    userId,
  );
  const byCountry: Record<string, number> = {};
  const decades = new Set<number>();
  let seaHorror = 0;
  for (const f of logged) {
    byCountry[f.country] = (byCountry[f.country] ?? 0) + 1;
    decades.add(Math.floor(f.year / 10));
    if (SEA_CODES.includes(f.country) && f.genres.split(",").includes("Horror")) seaHorror++;
  }
  const n = (sql: string, ...p: (string | number)[]) => (one<{ n: number }>(sql, ...p)?.n ?? 0);
  return {
    filmsLogged: logged.length,
    countries: Object.keys(byCountry).length,
    seaCountries: Object.keys(byCountry).filter((c) => SEA_CODES.includes(c)).length,
    byCountry,
    seaHorror,
    decades: decades.size,
    rewatches: n("SELECT COUNT(*) n FROM logs WHERE user_id = ? AND rewatch = 1", userId),
    fiveStars: n("SELECT COUNT(DISTINCT film_id) n FROM logs WHERE user_id = ? AND rating = 5", userId),
    midnightLogs: n("SELECT COUNT(*) n FROM logs WHERE user_id = ? AND local_hour BETWEEN 0 AND 3", userId),
    reviews: n("SELECT COUNT(*) n FROM reviews WHERE user_id = ?", userId),
    longestReview: n("SELECT COALESCE(MAX(LENGTH(body)),0) n FROM reviews WHERE user_id = ?", userId),
    likesReceived: n("SELECT COUNT(*) n FROM review_likes rl JOIN reviews r ON r.id = rl.review_id WHERE r.user_id = ?", userId),
    bigLists: n("SELECT COUNT(*) n FROM lists l WHERE l.user_id = ? AND (SELECT COUNT(*) FROM list_items i WHERE i.list_id = l.id) >= 5", userId),
    cinemaVisits: n("SELECT COUNT(*) n FROM cinema_purchases WHERE user_id = ?", userId),
    cinemaChains: n("SELECT COUNT(DISTINCT chain_id) n FROM cinema_purchases WHERE user_id = ?", userId),
    localCinemaVisits: n("SELECT COUNT(*) n FROM cinema_purchases WHERE user_id = ? AND local_bonus = 1", userId),
    gamesWon: n("SELECT COUNT(*) n FROM game_plays WHERE user_id = ? AND won = 1", userId),
    following: n("SELECT COUNT(*) n FROM follows WHERE follower_id = ?", userId),
    itemsBought: n("SELECT COUNT(*) n FROM inventory WHERE user_id = ? AND source = 'shop'", userId),
    legendaryOwned: all<{ item_id: string }>("SELECT item_id FROM inventory WHERE user_id = ?", userId).filter(
      (i) => ITEM_BY_ID[i.item_id]?.rarity === "legendary",
    ).length,
    eggsFound: n("SELECT COUNT(*) n FROM user_achievements WHERE user_id = ? AND achievement_id LIKE 'egg\\_%' ESCAPE '\\' AND achievement_id != 'egg_hunter'", userId),
    loggedSlugs: new Set(logged.map((f) => f.slug)),
    regions: new Set(logged.map((f) => regionOf(f.country)).filter(Boolean)).size,
    seriesLogged: logged.filter((f) => f.kind === "series").length,
    eventsJoined: n(
      `SELECT COUNT(*) n FROM (
         SELECT event_id || '@' || occurrence k FROM event_claims WHERE user_id = ?
         UNION SELECT substr(ref, 1, instr(ref, '#') - 1) FROM points_ledger WHERE user_id = ? AND reason = 'event')`,
      userId, userId,
    ),
    scoresReported: n("SELECT COUNT(*) n FROM external_scores WHERE user_id = ? AND source = 'community'", userId),
    stickersGiven: n("SELECT COUNT(*) n FROM review_stickers WHERE user_id = ?", userId),
  };
}

function unlocked(userId: number): Set<string> {
  return new Set(all<{ achievement_id: string }>("SELECT achievement_id FROM user_achievements WHERE user_id = ?", userId).map((r) => r.achievement_id));
}

/** Grant one achievement (with its points + item reward). Returns false if already had. */
export function unlock(userId: number, achievementId: string): boolean {
  const a = ACHIEVEMENT_BY_ID[achievementId];
  if (!a) return false;
  return tx(() => {
    const r = run("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?,?)", userId, a.id);
    if (r.changes === 0) return false;
    award(userId, a.points, "achievement", a.id, `Achievement: ${a.name}`, { silent: true });
    const reward = a.reward && ITEM_BY_ID[a.reward];
    if (reward) grantItem(userId, reward.id, `achievement:${a.id}`);
    notify(userId, "achievement", a.icon, `Achievement unlocked: ${a.name}`, `+${a.points} KP${reward ? ` · New ${reward.type}: ${reward.name}` : ""}`);
    return true;
  });
}

/** Re-evaluate all progress-based achievements. Loops so chained ones (e.g. egg_hunter) fire. */
export function checkAchievements(userId: number): string[] {
  const got: string[] = [];
  for (let i = 0; i < 3; i++) {
    const newly = satisfied(computeStats(userId), unlocked(userId));
    if (newly.length === 0) break;
    for (const a of newly) if (unlock(userId, a.id)) got.push(a.id);
  }
  return got;
}

export function achievementProgress(userId: number) {
  const stats = computeStats(userId);
  const have = all<{ achievement_id: string; unlocked_at: string }>(
    "SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?",
    userId,
  );
  const when = new Map(have.map((h) => [h.achievement_id, h.unlocked_at]));
  return ACHIEVEMENTS.map((a) => {
    const [cur, goal] = a.progress ? a.progress(stats) : [when.has(a.id) ? 1 : 0, 1];
    return {
      id: a.id, name: a.name, description: a.description, icon: a.icon, points: a.points,
      hidden: !!a.hidden, reward: a.reward ?? null,
      unlockedAt: when.get(a.id) ?? null,
      current: Math.min(cur, goal), goal,
    };
  });
}
