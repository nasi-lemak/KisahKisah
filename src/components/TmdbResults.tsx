import Link from "next/link";
import { one } from "@/lib/db";
import { posterUrl, type SearchHit } from "@/lib/tmdb-core";
import { ImportButton } from "./ImportButton";

/** TMDB search hits, marking the ones already in the catalogue. */
export function TmdbResults({ hits, signedIn }: { hits: SearchHit[]; signedIn: boolean }) {
  if (!hits.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hits.map((h) => {
        const have = one<{ slug: string }>("SELECT slug FROM films WHERE tmdb_id = ? AND kind = ?", h.tmdb_id, h.kind);
        const img = posterUrl(h.poster_path, "w185");
        return (
          <article key={`${h.kind}-${h.tmdb_id}`} className="card flex gap-3 p-3">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {img ? <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl">🎬</div>}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-semibold leading-tight">{h.title} <span className="font-normal text-muted">{h.year ?? ""}</span></div>
              <div className="text-xs text-muted">{h.kind === "series" ? "TV series" : "Film"}{h.original_title ? ` · ${h.original_title}` : ""}{h.country ? ` · ${h.country}` : ""}</div>
              <p className="line-clamp-2 text-xs text-muted">{h.overview}</p>
              {have ? (
                <Link href={`/film/${have.slug}`} className="text-xs font-semibold text-saffron">Already here →</Link>
              ) : signedIn ? (
                <ImportButton kind={h.kind} id={h.tmdb_id} />
              ) : (
                <Link href="/login" className="text-xs text-saffron">Sign in to add it</Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
