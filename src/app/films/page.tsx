import Link from "next/link";
import type { Metadata } from "next";
import { listFilms, type FilmFilter } from "@/lib/queries";
import { COUNTRIES, REGIONS, country, type RegionId } from "@/lib/regions";
import { GENRES } from "@/lib/catalog";
import { Poster, Stars, Empty } from "@/components/ui";
import { SearchQuip } from "@/components/SearchQuip";

export const metadata: Metadata = { title: "Films & TV" };

type SP = Promise<Record<string, string | undefined>>;

export default async function FilmsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filter: FilmFilter = {
    q: sp.q?.slice(0, 80) || undefined,
    country: sp.country && country(sp.country) ? sp.country.toUpperCase() : undefined,
    region: sp.region && sp.region in REGIONS ? (sp.region as RegionId) : undefined,
    genre: sp.genre && (GENRES as readonly string[]).includes(sp.genre) ? sp.genre : undefined,
    kind: sp.kind === "film" || sp.kind === "series" ? sp.kind : undefined,
    sort: (["popular", "rating", "newest", "oldest", "title"] as const).find((s) => s === sp.sort) ?? "popular",
  };
  const films = listFilms(filter);
  const c = country(filter.country);
  const noun = filter.kind === "series" ? "Series" : filter.kind === "film" ? "Films" : "Films & series";
  const heading = c ? `${c.flag} ${noun} from ${c.name}` : filter.region ? `${REGIONS[filter.region].icon} ${noun} from ${REGIONS[filter.region].name}` : filter.q ? `Results for “${filter.q}”` : noun;

  const qs = (patch: Record<string, string | undefined>) => {
    const next = { ...sp, ...patch };
    const s = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `/films?${s}` : "/films";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{heading}</h1>
        {c && c.platforms.length > 0 && (
          <p className="mt-1 text-sm text-muted">Films from {c.name} link straight to local review platforms where audiences there rate them.</p>
        )}
      </div>
      {filter.q && <SearchQuip q={filter.q} />}

      <form className="card flex flex-wrap items-end gap-3 p-4" action="/films">
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={filter.q} className="input" placeholder="Title, original title or director" />
        </div>
        <div>
          <label className="label" htmlFor="region">Region</label>
          <select id="region" name="region" defaultValue={filter.region ?? ""} className="input">
            <option value="">All regions</option>
            {Object.entries(REGIONS).map(([id, r]) => (
              <option key={id} value={id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <select id="country" name="country" defaultValue={filter.country ?? ""} className="input">
            <option value="">Any</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="genre">Genre</label>
          <select id="genre" name="genre" defaultValue={filter.genre ?? ""} className="input">
            <option value="">Any</option>
            {GENRES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={filter.sort} className="input">
            <option value="popular">Most logged</option>
            <option value="rating">Highest rated</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">A–Z</option>
          </select>
        </div>
        <button className="btn btn-primary">Filter</button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {([[undefined, "All"], ["film", "🎬 Films"], ["series", "📺 Series"]] as const).map(([k, label]) => (
          <Link key={label} href={qs({ kind: k })} className={`chip ${filter.kind === k ? "border-saffron text-saffron" : ""}`}>{label}</Link>
        ))}
        <Link href="/collections" className="chip">🎞️ Trilogies & collections</Link>
        <span className="mx-1 w-px bg-line" />
        {(Object.keys(REGIONS) as RegionId[]).filter((r) => r !== "sea").map((r) => (
          <Link key={r} href={qs({ region: r, country: undefined })} className={`chip ${filter.region === r ? "border-saffron text-saffron" : ""}`}>
            {REGIONS[r].icon} {REGIONS[r].name}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={qs({ region: "sea", country: undefined })} className={`chip ${filter.region === "sea" ? "border-saffron text-saffron" : ""}`}>🌏 Southeast Asia</Link>
        {COUNTRIES.filter((c) => c.region === "sea").map((x) => (
          <Link key={x.code} href={qs({ country: x.code, region: undefined })} className={`chip ${filter.country === x.code ? "border-saffron text-saffron" : ""}`}>
            {x.flag} {x.name}
          </Link>
        ))}
      </div>

      {films.length === 0 ? (
        <Empty>
          No films match. <Link href="/films" className="text-saffron">Clear filters</Link>
        </Empty>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {films.map((f) => (
            <div key={f.id}>
              <Poster film={f} />
              <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                <span>{f.avg_rating ? <Stars rating={Math.round(f.avg_rating * 2) / 2} /> : "No ratings"}</span>
                <span title="Logged">👁 {f.log_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
