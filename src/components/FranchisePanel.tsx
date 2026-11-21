import Link from "next/link";
import { franchisesFor, type Franchise } from "@/lib/franchises";
import { all } from "@/lib/db";
import { filmsBySlugs } from "@/lib/queries";
import { Poster } from "./ui";
import { saveCollectionAsCatalogue } from "@/app/actions";

export function watchedSlugs(userId: number | undefined, slugs: string[]): Set<string> {
  if (!userId || !slugs.length) return new Set();
  return new Set(
    all<{ slug: string }>(
      `SELECT DISTINCT f.slug FROM logs l JOIN films f ON f.id = l.film_id WHERE l.user_id = ? AND f.slug IN (${slugs.map(() => "?").join(",")})`,
      userId, ...slugs,
    ).map((r) => r.slug),
  );
}

export function FranchiseRow({ f, current, viewerId, compact = false }: { f: Franchise; current?: string; viewerId?: number; compact?: boolean }) {
  const films = filmsBySlugs(f.entries.map((e) => e.slug));
  const byslug = new Map(films.map((x) => [x.slug, x]));
  const seen = watchedSlugs(viewerId, f.entries.map((e) => e.slug));
  const done = f.entries.filter((e) => seen.has(e.slug)).length;
  const storyTitles = f.storyOrder?.map((s) => byslug.get(s)?.title).filter(Boolean);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link href={`/collections#${f.id}`} className="font-display text-xl font-bold hover:text-saffron">{f.name}</Link>
        <span className="rounded bg-lotus/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-lotus">{f.kind}</span>
        <span className="text-sm text-muted">{f.entries.length} titles</span>
        {viewerId && (
          <span className={`ml-auto text-sm font-semibold ${done === f.entries.length ? "text-jade" : "text-muted"}`}>
            {done === f.entries.length ? "✓ Completed" : `You've seen ${done} of ${f.entries.length}`}
          </span>
        )}
      </div>
      {!compact && <p className="text-sm text-muted">{f.blurb}</p>}
      {viewerId && (
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-jade transition-all" style={{ width: `${(done / f.entries.length) * 100}%` }} />
        </div>
      )}
      <ol className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {f.entries.map((e) => {
          const film = byslug.get(e.slug);
          if (!film) return null;
          const isCurrent = e.slug === current;
          return (
            <li key={e.slug} className="relative">
              <div className={`absolute -left-1.5 -top-1.5 z-10 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-extrabold shadow-lg ${isCurrent ? "bg-saffron text-ink" : "bg-raised text-text ring-1 ring-line"}`}>
                {e.label}
              </div>
              {seen.has(e.slug) && <div className="absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-jade text-xs font-bold text-ink shadow-lg" title="Watched">✓</div>}
              <div className={isCurrent ? "rounded-lg ring-2 ring-saffron ring-offset-2 ring-offset-ink" : ""}>
                <Poster film={film} size="sm" />
              </div>
              <div className="mt-1 text-xs">
                <span className="font-semibold">{film.year}</span>
                {e.note && <span className="text-muted"> · {e.note}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
        {storyTitles && <span>📖 Story order: {storyTitles.join(" → ")}</span>}
        {viewerId && (
          <form action={saveCollectionAsCatalogue.bind(null, f.id)} className="ml-auto">
            <button className="chip hover:border-saffron">＋ Save as a catalogue</button>
          </form>
        )}
      </div>
    </div>
  );
}

/** Shown on a film page when the title belongs to a trilogy, saga or universe. */
export function FranchisePanel({ slug, viewerId }: { slug: string; viewerId?: number }) {
  const fs = franchisesFor(slug);
  if (!fs.length) return null;
  return (
    <section className="card space-y-6 p-5">
      {fs.map((f) => (
        <div key={f.id}>
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Part of a collection</div>
          <FranchiseRow f={f} current={slug} viewerId={viewerId} compact />
        </div>
      ))}
    </section>
  );
}
