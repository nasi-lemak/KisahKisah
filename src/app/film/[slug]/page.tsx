import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { filmBySlug, listsContainingFilm, ratingHistogram, reviewsForFilm, viewerFilmState } from "@/lib/queries";
import { country, justWatchLink, platformLinksFor } from "@/lib/regions";
import { Poster, Stars, Flag, Empty } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";
import { ListCard } from "@/components/ListCard";
import { LogForm } from "@/components/LogForm";
import { FavoriteButton, SignInPrompt } from "@/components/forms";
import { addToListForm, toggleWatchlist } from "@/app/actions";
import { ScoresPanel } from "@/components/ScoresPanel";
import { FranchisePanel } from "@/components/FranchisePanel";
import { franchisesFor, positionIn } from "@/lib/franchises";
import { bonusesFor } from "@/lib/events";
import { audience } from "@/lib/geo";
import { formatRuntime } from "@/lib/tmdb-core";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const f = filmBySlug((await params).slug);
  return { title: f ? `${f.title} (${f.year})` : "Film not found" };
}

export default async function FilmPage({ params, searchParams }: { params: Params; searchParams: Promise<{ logged?: string }> }) {
  const { slug } = await params;
  const film = filmBySlug(slug);
  if (!film) notFound();
  const { logged } = await searchParams;
  const user = await currentUser();
  const c = country(film.country);
  const links = platformLinksFor({ title: film.title, originalTitle: film.original_title, year: film.year, country: film.country });
  const local = links.filter((l) => l.local);
  const global = links.filter((l) => !l.local);
  const jw = justWatchLink(film.title, user?.home_country);
  const reviews = reviewsForFilm(film.id, user?.id ?? 0);
  const hist = ratingHistogram(film.id);
  const maxBucket = Math.max(1, ...hist);
  const state = user ? viewerFilmState(user.id, film.id) : null;
  const myLists = user ? all<{ id: number; title: string }>("SELECT id, title FROM lists WHERE user_id = ? ORDER BY created_at DESC", user.id) : [];
  const inLists = listsContainingFilm(film.id);
  const allFilms = all<{ id: number; title: string; year: number }>("SELECT id, title, year FROM films ORDER BY title");
  const today = new Date().toISOString().slice(0, 10);
  const bonuses = bonusesFor(film, undefined, await audience());

  return (
    <div className="space-y-10">
      <div className="grid gap-8 md:grid-cols-[240px_1fr_260px]">
        <div className="mx-auto w-48 md:w-full">
          <Poster film={film} size="lg" link={false} />
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            {film.title} <span className="font-sans text-2xl font-normal text-muted">{film.year}</span>
          </h1>
          {film.original_title && film.original_title !== film.title && <div className="mt-1 text-lg text-muted">{film.original_title}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {film.kind === "series" && <span className="rounded bg-lotus/20 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-lotus">TV series</span>}
            {film.kind === "series" && (film.seasons || film.status) && (
              <span className="text-text">
                {film.seasons ? `${film.seasons} season${film.seasons > 1 ? "s" : ""}` : ""}
                {film.seasons && film.status ? " · " : ""}
                {film.status === "ongoing" ? "still running" : film.status === "limited" ? "limited series" : film.status === "ended" ? "ended" : ""}
              </span>
            )}
            {franchisesFor(film.slug).map((f) => {
              const pos = positionIn(f, film.slug)!;
              return (
                <a key={f.id} href="#collection" className="rounded bg-saffron/15 px-1.5 py-0.5 text-xs font-bold text-saffron hover:bg-saffron/25">
                  {f.kind === "Trilogy" || f.kind === "Loose trilogy" ? "🎞️ " : "📚 "}
                  {f.name} · {pos.index} of {pos.total}
                </a>
              );
            })}
            {(film.runtime || film.episodes) && (
              <span className="text-text">
                {film.kind === "series" && film.episodes ? `${film.episodes} episodes${film.runtime ? " · " : ""}` : ""}
                {film.runtime ? `${formatRuntime(film.runtime)}${film.kind === "series" ? " each" : ""}` : ""}
              </span>
            )}
            <span>{film.kind === "series" ? "Created by" : "Directed by"} <span className="text-text">{film.director}</span></span>
            <span>·</span>
            <Flag code={film.country} withName />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {film.genres.split(",").map((g) => (
              <Link key={g} href={`/films?genre=${encodeURIComponent(g)}`} className="chip hover:border-saffron">{g}</Link>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed">{film.synopsis}</p>
          {film.cast_names && <p className="mt-2 text-sm text-muted">Starring <span className="text-text">{film.cast_names}</span></p>}
          {bonuses.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`} className="mt-3 flex w-fit items-center gap-2 rounded-lg border border-saffron/40 bg-saffron/10 px-3 py-1.5 text-sm">
              <span>{e.icon}</span>
              <span><b>{e.name}</b>: log this for +{e.bonus!.points} bonus KP</span>
            </Link>
          ))}

          {/* Review elsewhere */}
          <div className="mt-8 space-y-4">
            {local.length > 0 && (
              <div>
                <div className="label">Rate it where {c?.name ?? "locals"} do {c?.flag}</div>
                <div className="flex flex-wrap gap-2">
                  {local.map((l) => (
                    <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="chip py-1.5 hover:border-saffron" style={{ borderColor: `${l.color}aa` }}>
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                      <b>{l.badge}</b> <span className="text-muted">{l.name}</span> ↗
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="label">Elsewhere on the web</div>
              <div className="flex flex-wrap gap-2">
                {global.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="chip py-1.5 hover:border-saffron">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
                    {l.name} ↗
                  </a>
                ))}
                {jw && (
                  <a href={jw} target="_blank" rel="noopener noreferrer" className="chip py-1.5 hover:border-saffron">
                    📺 Where to watch {user ? `in ${country(user.home_country)?.flag ?? ""}` : ""} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: stats + actions */}
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <span className="label mb-0">KisahKisah rating</span>
              <span className="font-display text-3xl font-bold">{film.avg_rating ? film.avg_rating.toFixed(1) : "–"}</span>
            </div>
            <div className="mt-3 flex h-14 items-end gap-0.5" aria-label="Ratings histogram">
              {hist.map((n, i) => (
                <div key={i} className="flex-1 rounded-t bg-saffron/70" style={{ height: `${Math.max(4, (n / maxBucket) * 100)}%`, opacity: n ? 1 : 0.2 }} title={`${(i + 1) / 2}★: ${n}`} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>½</span>
              <span>{film.log_count} logs · {film.review_count} reviews</span>
              <span>★★★★★</span>
            </div>
          </div>

          {user && state ? (
            <div className="card space-y-2 p-4">
              {state.logged && (
                <div className="text-sm text-muted">
                  ✓ Watched{state.timesLogged > 1 ? ` ${state.timesLogged}×` : ""}, last on {state.lastWatched} {state.lastRating ? <Stars rating={state.lastRating} /> : null}
                </div>
              )}
              <a href="#log" className="btn btn-primary w-full justify-center">{state.logged ? "Log again / review" : "＋ Log or review"}</a>
              <form action={toggleWatchlist.bind(null, film.id)}>
                <button className="btn btn-ghost w-full justify-center">{state.inWatchlist ? "✓ On watchlist" : "🕒 Add to watchlist"}</button>
              </form>
              <FavoriteButton filmId={film.id} isFavorite={state.isFavorite} />
              {myLists.length > 0 ? (
                <form action={addToListForm} className="flex gap-2">
                  <input type="hidden" name="film_id" value={film.id} />
                  <select name="list_id" className="input py-1.5 text-sm" aria-label="Add to catalogue">
                    {myLists.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost py-1.5">Add</button>
                </form>
              ) : null}
              <Link href={`/lists/new?film=${film.id}`} className="block text-center text-xs text-muted hover:text-text">
                ＋ Start a new catalogue with this film
              </Link>
            </div>
          ) : (
            <SignInPrompt what="log, rate and review this film" next={`/film/${film.slug}`} />
          )}
        </aside>
      </div>

      <div id="collection" className="scroll-mt-24">
        <FranchisePanel slug={film.slug} viewerId={user?.id} />
      </div>

      <ScoresPanel film={film} signedIn={!!user} />

      {user && (
        <section id="log" className="card scroll-mt-24 p-6">
          {logged && <p className="mb-4 rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-sm text-emerald-300">Logged! It&apos;s in your diary.</p>}
          <h2 className="mb-4 font-display text-2xl font-bold">Your kisah with {film.title}</h2>
          <LogForm film={{ id: film.id, title: film.title }} films={allFilms} today={today} />
        </section>
      )}

      <section>
        <h2 className="section-title">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <Empty>No reviews yet. Be the first to tell your kisah!</Empty>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} r={r} viewerId={user?.id} showFilm={false} />
            ))}
          </div>
        )}
      </section>

      {inLists.length > 0 && (
        <section>
          <h2 className="section-title">In these catalogues</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {inLists.map((l) => (
              <ListCard key={l.id} l={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
