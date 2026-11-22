import "server-only";
import { all, one } from "./db";
import { country, regionOf, SEA_CODES } from "./regions";

/**
 * Kisah Rewind: a Spotify-Wrapped-style recap of a member's year in films
 * and series. Everything is computed from their diary, nothing is stored.
 */

import { EST_HOURS, longestStreak, pickArchetype } from "./rewind-core";
import { hoursFor } from "./tmdb-core";
export { EST_HOURS, longestStreak, pickArchetype };

type LogRow = {
  watched_on: string; rating: number | null; rewatch: number; cinema_chain: string | null; local_hour: number | null;
  film_id: number; slug: string; title: string; year: number; country: string; genres: string; director: string; kind: string; motif: string; poster_path: string | null; runtime: number | null; episodes: number | null; seasons: number | null;
};

export function computeRewind(userId: number, year: number) {
  const logs = all<LogRow>(
    `SELECT l.watched_on, l.rating, l.rewatch, l.cinema_chain, l.local_hour,
            f.id film_id, f.slug, f.title, f.year, f.country, f.genres, f.director, f.kind, f.motif, f.poster_path, f.runtime, f.episodes, f.seasons
     FROM logs l JOIN films f ON f.id = l.film_id
     WHERE l.user_id = ? AND l.watched_on BETWEEN ? AND ? ORDER BY l.watched_on, l.id`,
    userId, `${year}-01-01`, `${year}-12-31`,
  );
  const titles = new Map<number, LogRow>();
  for (const l of logs) titles.set(l.film_id, l);
  const unique = [...titles.values()];
  const films = unique.filter((t) => t.kind !== "series");
  const series = unique.filter((t) => t.kind === "series");

  const tally = <T extends string>(xs: T[]) => {
    const m = new Map<T, number>();
    for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const genres = tally(unique.flatMap((t) => t.genres.split(",")));
  const countries = tally(unique.map((t) => t.country));
  const directors = tally(unique.flatMap((t) => t.director.split(",").map((d) => d.trim())));
  const months = Array(12).fill(0) as number[];
  for (const l of logs) months[Number(l.watched_on.slice(5, 7)) - 1]++;
  const busiest = months.indexOf(Math.max(...months));
  const rated = logs.filter((l) => l.rating !== null);
  const avgRating = rated.length ? rated.reduce((a, l) => a + l.rating!, 0) / rated.length : null;

  // Best of the year: highest rating, ties by most recent.
  const best = new Map<number, LogRow>();
  for (const l of rated) if (!best.has(l.film_id) || l.rating! >= best.get(l.film_id)!.rating!) best.set(l.film_id, l);
  const topRated = [...best.values()].sort((a, b) => b.rating! - a.rating! || b.watched_on.localeCompare(a.watched_on)).slice(0, 5);

  const n = (sql: string, ...p: (string | number)[]) => one<{ n: number }>(sql, ...p)?.n ?? 0;
  const from = `${year}-01-01`, to = `${year + 1}-01-01`;
  const reviews = n("SELECT COUNT(*) n FROM reviews WHERE user_id = ? AND created_at >= ? AND created_at < ?", userId, from, to);
  const earned = n("SELECT COALESCE(SUM(delta),0) n FROM points_ledger WHERE user_id = ? AND delta > 0 AND created_at >= ? AND created_at < ?", userId, from, to);
  const achievements = n("SELECT COUNT(*) n FROM user_achievements WHERE user_id = ? AND unlocked_at >= ? AND unlocked_at < ?", userId, from, to);
  const likes = n(
    "SELECT COUNT(*) n FROM review_likes rl JOIN reviews r ON r.id = rl.review_id WHERE r.user_id = ? AND r.created_at >= ? AND r.created_at < ?",
    userId, from, to,
  );

  // Percentile vs everyone who logged something this year
  const counts = all<{ n: number }>(
    "SELECT COUNT(*) n FROM logs WHERE watched_on BETWEEN ? AND ? GROUP BY user_id",
    `${year}-01-01`, `${year}-12-31`,
  ).map((r) => r.n);
  const beaten = counts.filter((c) => c < logs.length).length;
  const topPercent = counts.length > 1 && logs.length ? Math.max(1, Math.round(100 - (beaten / counts.length) * 100)) : null;

  const regions = new Set(unique.map((t) => regionOf(t.country)).filter(Boolean));
  const seaCount = unique.filter((t) => SEA_CODES.includes(t.country)).length;
  const cinemaTrips = logs.filter((l) => l.cinema_chain).length;
  const midnight = logs.filter((l) => l.local_hour !== null && l.local_hour < 4).length;

  const archetype = pickArchetype({
    total: unique.length,
    horror: unique.filter((t) => t.genres.split(",").includes("Horror")).length,
    series: series.length,
    korean: unique.filter((t) => t.country === "KR").length,
    sea: seaCount, countries: countries.length, regions: regions.size,
    cinema: cinemaTrips, reviews, midnight, avgRating,
  });

  const pick = (t: LogRow) => ({ slug: t.slug, title: t.title, year: t.year, country: t.country, motif: t.motif, kind: t.kind, poster_path: t.poster_path });
  return {
    year,
    logs: logs.length,
    titles: unique.length,
    films: films.length,
    series: series.length,
    hours: Math.round(unique.reduce((h, t) => h + hoursFor(t).hours, 0)),
    hoursEstimated: unique.some((t) => hoursFor(t).estimated),
    rewatches: logs.filter((l) => l.rewatch).length,
    reviews, likes, earned, achievements, cinemaTrips, midnight,
    avgRating: avgRating === null ? null : Math.round(avgRating * 10) / 10,
    topGenres: genres.slice(0, 3).map(([g, c]) => ({ genre: g, count: c })),
    countries: countries.map(([c, k]) => ({ code: c, flag: country(c)?.flag ?? "🏳️", name: country(c)?.name ?? c, count: k })),
    regions: regions.size,
    seaShare: unique.length ? Math.round((seaCount / unique.length) * 100) : 0,
    topDirector: directors[0] ? { name: directors[0][0], count: directors[0][1] } : null,
    topRated: topRated.map((t) => ({ ...pick(t), rating: t.rating! })),
    first: logs[0] ? pick(logs[0]) : null,
    last: logs.at(-1) ? pick(logs.at(-1)!) : null,
    months,
    busiestMonth: logs.length ? new Date(Date.UTC(year, busiest, 1)).toLocaleString("en-GB", { month: "long", timeZone: "UTC" }) : null,
    streak: longestStreak(logs.map((l) => l.watched_on)),
    topPercent,
    archetype,
  };
}

export type Rewind = ReturnType<typeof computeRewind>;

export function rewindYears(userId: number): number[] {
  return all<{ y: string }>("SELECT DISTINCT substr(watched_on, 1, 4) y FROM logs WHERE user_id = ? ORDER BY y DESC", userId).map((r) => Number(r.y));
}
