import "server-only";
import { one, run } from "./db";
import { COUNTRY_BY_CODE } from "./regions";
import { mapMovie, mapSearch, mapTv, type ImportedTitle, type Kind, type SearchHit } from "./tmdb-core";

/**
 * TMDB client. TMDB_API_KEY can be a v3 key (sent as api_key) or a v4 read token (sent as a bearer token).
 * TMDB_API_BASE exists so tests can point at a local mock.
 */
export function tmdbConfigured(): boolean {
  return !!process.env.TMDB_API_KEY;
}

async function tmdb(path: string, params: Record<string, string> = {}): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set.");
  const base = (process.env.TMDB_API_BASE || "https://api.themoviedb.org/3").replace(/\/$/, "");
  const bearer = key.length > 40;
  const q = new URLSearchParams({ ...params, ...(bearer ? {} : { api_key: key }) });
  const res = await fetch(`${base}${path}?${q}`, {
    headers: { accept: "application/json", ...(bearer ? { authorization: `Bearer ${key}` } : {}) },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export async function searchTmdb(query: string): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 100);
  if (!q) return [];
  const data = await tmdb("/search/multi", { query: q, include_adult: "false" });
  return mapSearch(data.results ?? []);
}

const known = (c: string) => !!COUNTRY_BY_CODE[c];

export async function fetchTitle(kind: Kind, id: number): Promise<ImportedTitle> {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Bad TMDB id.");
  return kind === "series"
    ? mapTv(await tmdb(`/tv/${id}`, { append_to_response: "aggregate_credits,external_ids" }), known)
    : mapMovie(await tmdb(`/movie/${id}`, { append_to_response: "credits" }), known);
}

/** Insert a TMDB title, or refresh the row already linked to it. Returns the slug. */
export function upsertTitle(t: ImportedTitle): { slug: string; created: boolean } {
  const existing = one<{ id: number; slug: string }>("SELECT id, slug FROM films WHERE tmdb_id = ? AND kind = ?", t.tmdb_id, t.kind);
  if (existing) {
    run(
      `UPDATE films SET poster_path = ?, backdrop_path = ?, runtime = ?, episodes = ?, seasons = COALESCE(?, seasons), status = COALESCE(?, status),
         imdb_id = COALESCE(?, imdb_id), cast_names = ?, release_date = COALESCE(?, release_date), synopsis = CASE WHEN synopsis = '' OR synopsis = 'No synopsis yet.' THEN ? ELSE synopsis END
       WHERE id = ?`,
      t.poster_path, t.backdrop_path, t.runtime, t.episodes, t.seasons, t.status, t.imdb_id, t.cast_names, t.release_date, t.synopsis, existing.id,
    );
    return { slug: existing.slug, created: false };
  }
  // Same title and year already in the hand-made catalogue? Link it instead of duplicating.
  const twin = one<{ id: number; slug: string }>(
    "SELECT id, slug FROM films WHERE tmdb_id IS NULL AND kind = ? AND year = ? AND (lower(title) = lower(?) OR lower(original_title) = lower(?))",
    t.kind, t.year, t.title, t.original_title ?? t.title,
  );
  if (twin) {
    run("UPDATE films SET tmdb_id = ? WHERE id = ?", t.tmdb_id, twin.id);
    return upsertTitle(t);
  }
  let slug = t.slug;
  for (let i = 2; one("SELECT 1 x FROM films WHERE slug = ?", slug); i++) slug = `${t.slug}-${i}`;
  run(
    `INSERT INTO films (slug, kind, title, original_title, year, country, director, genres, motif, synopsis, seasons, status,
       tmdb_id, imdb_id, poster_path, backdrop_path, runtime, episodes, cast_names, release_date)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    slug, t.kind, t.title, t.original_title, t.year, t.country, t.director, t.genres, t.motif, t.synopsis, t.seasons, t.status,
    t.tmdb_id, t.imdb_id, t.poster_path, t.backdrop_path, t.runtime, t.episodes, t.cast_names, t.release_date,
  );
  return { slug, created: true };
}

/** For a hand-made catalogue title: find its TMDB match (same year, same kind) and fill posters and runtimes. */
export async function enrich(film: { id: number; title: string; original_title: string | null; year: number; kind: string }): Promise<boolean> {
  const hits = (await searchTmdb(film.title)).filter((h) => h.kind === film.kind && h.year !== null && Math.abs(h.year - film.year) <= 1);
  const norm = (s: string | null) => (s ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const hit = hits.find((h) => norm(h.title) === norm(film.title) || (film.original_title && norm(h.original_title ?? h.title) === norm(film.original_title))) ?? null;
  if (!hit) return false;
  run("UPDATE films SET tmdb_id = ? WHERE id = ? AND tmdb_id IS NULL", hit.tmdb_id, film.id);
  upsertTitle(await fetchTitle(hit.kind, hit.tmdb_id));
  return true;
}
