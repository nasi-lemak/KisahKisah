// Sync external scores into the local DB.
//
//   OMDB_API_KEY=... TMDB_API_KEY=... npm run scores:sync [-- --dry-run] [-- --limit 10]
//
// OMDb gives IMDb, Rotten Tomatoes and Metacritic; TMDB gives its own user score.
// Platforms with no public API (Douban, Watcha, Filmarks…) come from member
// reports or partner feeds instead. Respect each provider's terms & rate limits.
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { parseOmdb, parseTmdb } from "./score-sources.mjs";

const args = process.argv.slice(2);
const dry = args.includes("--dry-run");
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const { OMDB_API_KEY, TMDB_API_KEY } = process.env;
if (!OMDB_API_KEY && !TMDB_API_KEY) {
  console.error("Set OMDB_API_KEY and/or TMDB_API_KEY.");
  process.exit(1);
}

const db = new DatabaseSync(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "kisahkisah.db"));
const films = db.prepare("SELECT id, title, year, kind FROM films ORDER BY id").all().slice(0, limit);
const upsert = db.prepare(
  `INSERT INTO external_scores (film_id, platform, value, votes, source, url) VALUES (?,?,?,?,'api',?)
   ON CONFLICT (film_id, platform) WHERE source = 'api'
   DO UPDATE SET value = excluded.value, votes = excluded.votes, url = COALESCE(excluded.url, url), updated_at = datetime('now')`,
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

let written = 0;
for (const f of films) {
  const rows = [];
  try {
    if (OMDB_API_KEY) {
      const q = new URLSearchParams({ apikey: OMDB_API_KEY, t: f.title, y: String(f.year), type: f.kind === "series" ? "series" : "movie" });
      rows.push(...parseOmdb(await getJson(`https://www.omdbapi.com/?${q}`)));
    }
    if (TMDB_API_KEY) {
      const isTv = f.kind === "series";
      const q = new URLSearchParams({ api_key: TMDB_API_KEY, query: f.title, [isTv ? "first_air_date_year" : "year"]: String(f.year) });
      rows.push(...parseTmdb(await getJson(`https://api.themoviedb.org/3/search/${isTv ? "tv" : "movie"}?${q}`), f.kind));
    }
  } catch (e) {
    console.warn(`✗ ${f.title}: ${e.message}`);
    continue;
  }
  for (const r of rows) {
    if (!dry) upsert.run(f.id, r.platform, r.value, r.votes, r.url);
    written++;
  }
  console.log(`${rows.length ? "✓" : "·"} ${f.title} (${f.year}) ${rows.map((r) => `${r.platform}=${r.value}`).join(" ")}`);
  await sleep(250);
}
console.log(`${dry ? "[dry run] would write" : "Wrote"} ${written} scores for ${films.length} titles.`);
