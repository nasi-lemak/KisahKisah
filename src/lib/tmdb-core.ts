/** Pure mapping from TMDB API payloads to KisahKisah catalogue rows. Tested against fixtures. */

export type Kind = "film" | "series";

export type ImportedTitle = {
  tmdb_id: number; kind: Kind; slug: string; title: string; original_title: string | null; year: number; country: string;
  director: string; genres: string; motif: string; synopsis: string; poster_path: string | null; backdrop_path: string | null;
  runtime: number | null; episodes: number | null; seasons: number | null; status: string | null; imdb_id: string | null; cast_names: string;
  /** Film: release date. Series: next episode's air date if announced, else the premiere. */
  release_date: string | null;
};

export type SearchHit = { tmdb_id: number; kind: Kind; title: string; original_title: string | null; year: number | null; poster_path: string | null; overview: string; country: string | null };

const GENRE_MAP: Record<string, string[]> = {
  Action: ["Action"], Adventure: ["Action"], "Action & Adventure": ["Action"], Animation: ["Animation"], Comedy: ["Comedy"],
  Crime: ["Crime"], Documentary: ["Documentary"], Drama: ["Drama"], Family: ["Family"], Kids: ["Family"], Fantasy: ["Fantasy"],
  History: ["History"], "War & Politics": ["History"], War: ["History"], Horror: ["Horror"], Music: ["Musical"], Mystery: ["Mystery"],
  Romance: ["Romance"], "Science Fiction": ["Sci-Fi"], "Sci-Fi & Fantasy": ["Sci-Fi", "Fantasy"], Thriller: ["Thriller"],
  Western: ["Action"], Soap: ["Drama"], Reality: ["Documentary"], "TV Movie": [],
};

export function mapGenres(names: string[]): string[] {
  const out: string[] = [];
  for (const n of names) for (const g of GENRE_MAP[n] ?? []) if (!out.includes(g)) out.push(g);
  return out.length ? out.slice(0, 4) : ["Drama"];
}

const MOTIF: [string, string][] = [
  ["Horror", "👻"], ["Sci-Fi", "🚀"], ["Animation", "🎨"], ["Romance", "💞"], ["Comedy", "😂"], ["Crime", "🕵️"], ["Thriller", "🔪"],
  ["Action", "💥"], ["Fantasy", "🐉"], ["Documentary", "🎥"], ["Musical", "🎶"], ["Sports", "⚽"], ["History", "🏯"], ["Family", "🏡"], ["Mystery", "🔍"],
];

export function motifFor(genres: string[]): string {
  return MOTIF.find(([g]) => genres.includes(g))?.[1] ?? "🎬";
}

export function slugFor(title: string, year: number): string {
  const base = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `${base || "title"}-${year}`;
}

const isoDate = (d: unknown) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
const yearOf = (d: unknown) => (typeof d === "string" && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

/** First production/origin country we know, else the first one given. */
export function pickCountry(codes: (string | undefined)[], known: (c: string) => boolean): string {
  const clean = codes.filter((c): c is string => !!c && /^[A-Z]{2}$/.test(c));
  return clean.find(known) ?? clean[0] ?? "US";
}

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function mapMovie(m: Json, known: (c: string) => boolean = () => true): ImportedTitle {
  const genres = mapGenres((m.genres ?? []).map((g: Json) => g.name));
  const year = yearOf(m.release_date) ?? new Date().getUTCFullYear();
  const crew: Json[] = m.credits?.crew ?? [];
  const directors = crew.filter((c) => c.job === "Director").map((c) => c.name);
  return {
    tmdb_id: m.id, kind: "film", slug: slugFor(m.title ?? m.original_title ?? "title", year),
    title: m.title ?? m.original_title, original_title: m.original_title && m.original_title !== m.title ? m.original_title : null,
    year, country: pickCountry([...(m.origin_country ?? []), ...(m.production_countries ?? []).map((c: Json) => c.iso_3166_1)], known),
    director: directors.slice(0, 2).join(" & ") || "Unknown", genres: genres.join(","), motif: motifFor(genres),
    synopsis: (m.overview ?? "").trim() || "No synopsis yet.", poster_path: m.poster_path ?? null, backdrop_path: m.backdrop_path ?? null,
    runtime: m.runtime || null, episodes: null, seasons: null, status: null,
    imdb_id: m.imdb_id ?? m.external_ids?.imdb_id ?? null,
    cast_names: (m.credits?.cast ?? []).slice(0, 6).map((c: Json) => c.name).join(", "),
    release_date: isoDate(m.release_date),
  };
}

export function seriesStatus(status: string | undefined, type: string | undefined): string | null {
  if (type === "Miniseries") return "limited";
  if (status === "Returning Series" || status === "In Production" || status === "Planned") return "ongoing";
  if (status === "Ended" || status === "Canceled") return "ended";
  return null;
}

export function mapTv(t: Json, known: (c: string) => boolean = () => true): ImportedTitle {
  const genres = mapGenres((t.genres ?? []).map((g: Json) => g.name));
  const year = yearOf(t.first_air_date) ?? new Date().getUTCFullYear();
  const runtime = (t.episode_run_time ?? [])[0] ?? t.last_episode_to_air?.runtime ?? null;
  return {
    tmdb_id: t.id, kind: "series", slug: slugFor(t.name ?? t.original_name ?? "title", year),
    title: t.name ?? t.original_name, original_title: t.original_name && t.original_name !== t.name ? t.original_name : null,
    year, country: pickCountry([...(t.origin_country ?? []), ...(t.production_countries ?? []).map((c: Json) => c.iso_3166_1)], known),
    director: (t.created_by ?? []).slice(0, 2).map((c: Json) => c.name).join(" & ") || "Unknown",
    genres: genres.join(","), motif: motifFor(genres), synopsis: (t.overview ?? "").trim() || "No synopsis yet.",
    poster_path: t.poster_path ?? null, backdrop_path: t.backdrop_path ?? null, runtime: runtime || null,
    episodes: t.number_of_episodes ?? null, seasons: t.number_of_seasons ?? null, status: seriesStatus(t.status, t.type),
    imdb_id: t.external_ids?.imdb_id ?? null,
    cast_names: (t.aggregate_credits?.cast ?? t.credits?.cast ?? []).slice(0, 6).map((c: Json) => c.name).join(", "),
    release_date: isoDate(t.next_episode_to_air?.air_date) ?? isoDate(t.first_air_date),
  };
}

export function mapSearch(results: Json[]): SearchHit[] {
  return results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => ({
      tmdb_id: r.id, kind: r.media_type === "tv" ? "series" : "film",
      title: r.title ?? r.name, original_title: (r.original_title ?? r.original_name) !== (r.title ?? r.name) ? (r.original_title ?? r.original_name) : null,
      year: yearOf(r.release_date ?? r.first_air_date), poster_path: r.poster_path ?? null, overview: r.overview ?? "",
      country: (r.origin_country ?? [])[0] ?? null,
    }) as SearchHit)
    .slice(0, 12);
}

/** TMDB image sizes we use: w185 thumbnails, w342 cards, w780 hero. */
export function posterUrl(path: string | null | undefined, size: "w185" | "w342" | "w780" = "w342"): string | null {
  return path && /^\/[A-Za-z0-9._-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

/** Hours for a logged title: real runtimes when known, else a rough estimate. One log of a series = one season. */
export function hoursFor(t: { kind?: string | null; runtime?: number | null; episodes?: number | null; seasons?: number | null }): { hours: number; estimated: boolean } {
  if (t.kind === "series") {
    if (t.runtime && t.episodes) return { hours: (t.runtime * t.episodes) / Math.max(1, t.seasons ?? 1) / 60, estimated: false };
    return { hours: 8, estimated: true };
  }
  if (t.runtime) return { hours: t.runtime / 60, estimated: false };
  return { hours: 2, estimated: true };
}

export function formatRuntime(min: number | null | undefined): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}
