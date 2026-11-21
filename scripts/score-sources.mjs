// Pure parsers for score APIs, kept separate so they can be unit-tested offline.

/** OMDb (https://www.omdbapi.com) → IMDb, Rotten Tomatoes, Metacritic rows. */
export function parseOmdb(json) {
  if (!json || json.Response !== "True") return [];
  const rows = [];
  const imdb = Number.parseFloat(json.imdbRating);
  if (Number.isFinite(imdb)) {
    rows.push({
      platform: "imdb", value: imdb,
      votes: Number.parseInt(String(json.imdbVotes ?? "").replace(/,/g, ""), 10) || null,
      url: json.imdbID ? `https://www.imdb.com/title/${json.imdbID}/` : null,
    });
  }
  for (const r of json.Ratings ?? []) {
    if (r.Source === "Rotten Tomatoes") {
      const v = Number.parseFloat(r.Value);
      if (Number.isFinite(v)) rows.push({ platform: "rottentomatoes", value: v, votes: null, url: null });
    }
    if (r.Source === "Metacritic") {
      const v = Number.parseFloat(String(r.Value).split("/")[0]);
      if (Number.isFinite(v)) rows.push({ platform: "metacritic", value: v, votes: null, url: null });
    }
  }
  return rows;
}

/** TMDB search results → one TMDB row (first, most relevant match). */
export function parseTmdb(json, kind) {
  const hit = json?.results?.[0];
  if (!hit || !Number.isFinite(hit.vote_average) || !hit.vote_count) return [];
  return [{
    platform: "tmdb", value: Math.round(hit.vote_average * 10) / 10, votes: hit.vote_count,
    url: `https://www.themoviedb.org/${kind === "series" ? "tv" : "movie"}/${hit.id}`,
  }];
}
