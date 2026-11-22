import { one } from "@/lib/db";
import { searchTmdb, tmdbConfigured } from "@/lib/tmdb";
import { TmdbResults } from "@/components/TmdbResults";
import { EnrichButton } from "@/components/ImportButton";

export default async function AdminCatalog({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const on = tmdbConfigured();
  let hits: Awaited<ReturnType<typeof searchTmdb>> = [];
  let error = "";
  if (on && q) hits = await searchTmdb(q).catch((e) => ((error = (e as Error).message), []));
  const s = one<{ total: number; linked: number; posters: number; runtimes: number }>(
    "SELECT COUNT(*) total, COUNT(tmdb_id) linked, COUNT(poster_path) posters, COUNT(runtime) runtimes FROM films",
  )!;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Catalogue</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Titles", s.total], ["Linked to TMDB", s.linked], ["With posters", s.posters], ["With runtimes", s.runtimes]].map(([l, n]) => (
          <div key={l} className="glass p-4 text-center"><div className="font-display text-2xl font-bold">{n}</div><div className="text-xs text-muted">{l}</div></div>
        ))}
      </div>
      {!on ? (
        <div className="glass space-y-2 p-5 text-sm">
          <b>TMDB isn't connected.</b>
          <p className="text-muted">Set <code>TMDB_API_KEY</code> (a v3 key or a v4 read token from themoviedb.org) and restart. Then you can match the hand-made catalogue to real posters and runtimes, and members can add titles from film search.</p>
        </div>
      ) : (
        <>
          <section className="glass flex flex-wrap items-center gap-3 p-5">
            <div className="flex-1 text-sm text-muted">Find each hand-made title on TMDB (same title and year) and fill in its poster, runtime, episodes and cast. 25 per run.</div>
            <EnrichButton />
          </section>
          <section className="space-y-3">
            <form className="flex gap-2" action="/admin/catalog">
              <input name="q" defaultValue={q} className="input" placeholder="Search TMDB: title in any language" aria-label="Search TMDB" />
              <button className="btn btn-ghost">Search</button>
            </form>
            {error && <p className="text-sm text-red-300">TMDB error: {error}</p>}
            {q && !error && hits.length === 0 && <p className="text-sm text-muted">No results.</p>}
            <TmdbResults hits={hits} signedIn />
          </section>
        </>
      )}
      <p className="text-xs text-muted">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
    </div>
  );
}
