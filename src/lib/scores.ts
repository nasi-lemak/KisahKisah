import "server-only";
import { all, one, run } from "./db";
import { identifyPlatform, normaliseScore, platform, PLATFORMS, scoringPlatformsFor, type Platform } from "./regions";

/**
 * "Scores around the world": what a title scores on other platforms, next to
 * the KisahKisah score.
 *
 * - `api` rows come from scripts/sync-scores.mjs (OMDb → IMDb / Rotten
 *   Tomatoes / Metacritic, TMDB → TMDB), when API keys are configured.
 * - `community` rows are reported by members, each with a link to the page on
 *   that platform as proof. We show the median, so one troll can't move it.
 *
 * Platforms without an official API (Douban, Watcha, Filmarks…) rely on
 * community reports or, ideally, partner data feeds.
 */

export type PlatformScore = {
  id: string;
  name: string;
  badge: string;
  color: string;
  scale: number;
  unit: string;
  value: number | null;
  normalised: number | null;
  source: "api" | "community" | null;
  reports: number;
  votes: number | null;
  url: string | null;
  updatedAt: string | null;
  local: boolean;
};

export function formatScore(value: number, scale: number, unit: string): string {
  if (scale === 100) return unit === "%" ? `${Math.round(value)}%` : `${Math.round(value)}/100`;
  if (scale === 5) return `${value.toFixed(1)}★`;
  return `${value.toFixed(1)}/10`;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function scoresForFilm(film: { id: number; country: string; avg_rating: number | null; log_count: number }) {
  const rows = all<{ platform: string; value: number; votes: number | null; source: "api" | "community"; url: string | null; updated_at: string }>(
    "SELECT platform, value, votes, source, url, updated_at FROM external_scores WHERE film_id = ? ORDER BY updated_at DESC",
    film.id,
  );
  const localIds = new Set(scoringPlatformsFor(film.country).map((p) => p.id));
  // Show relevant platforms, plus any other platform someone has data for.
  const ids = [...new Set([...scoringPlatformsFor(film.country).map((p) => p.id), ...rows.map((r) => r.platform)])];
  const platforms: PlatformScore[] = ids
    .map((id) => platform(id))
    .filter((p): p is Platform => !!p?.scale)
    .map((p) => {
      const mine = rows.filter((r) => r.platform === p.id);
      const api = mine.find((r) => r.source === "api");
      const community = mine.filter((r) => r.source === "community");
      const value = api ? api.value : community.length ? median(community.map((r) => r.value)) : null;
      return {
        id: p.id, name: p.name, badge: p.badge, color: p.color, scale: p.scale!, unit: p.unit ?? "",
        value, normalised: value === null ? null : normaliseScore(value, p.scale!),
        source: api ? "api" : community.length ? "community" : null,
        reports: community.length, votes: api?.votes ?? null,
        url: api?.url ?? community[0]?.url ?? null,
        updatedAt: api?.updated_at ?? community[0]?.updated_at ?? null,
        local: localIds.has(p.id) && !["imdb", "letterboxd", "tmdb"].includes(p.id),
      };
    });

  const kisah = film.avg_rating ? { value: film.avg_rating, normalised: normaliseScore(film.avg_rating, 5), count: film.log_count } : null;
  const known = platforms.filter((p) => p.normalised !== null).map((p) => p.normalised!);
  if (kisah) known.push(kisah.normalised);
  const world = known.length >= 2 ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
  return { kisah, platforms, world, sources: known.length };
}

export function reportScore(userId: number, filmId: number, platformId: string, value: number, url: string): { ok: true } | { ok: false; error: string } {
  const p = platform(platformId);
  if (!p?.scale) return { ok: false, error: "That platform doesn't have scores we track." };
  if (!Number.isFinite(value) || value < 0 || value > p.scale) return { ok: false, error: `Scores on ${p.name} go from 0 to ${p.scale}.` };
  const host = identifyPlatform(url);
  if (!host || host.id !== p.id) return { ok: false, error: `Add a link to the title's page on ${p.name} as proof.` };
  if (!one("SELECT 1 x FROM films WHERE id = ?", filmId)) return { ok: false, error: "Title not found." };
  run(
    `INSERT INTO external_scores (film_id, platform, value, source, user_id, url) VALUES (?,?,?,'community',?,?)
     ON CONFLICT (film_id, platform, user_id) WHERE source = 'community' DO UPDATE SET value = excluded.value, url = excluded.url, updated_at = datetime('now')`,
    filmId, p.id, Math.round(value * 100) / 100, userId, url.slice(0, 500),
  );
  return { ok: true };
}

export const SCORING_PLATFORMS = Object.values(PLATFORMS).filter((p) => p.scale);
