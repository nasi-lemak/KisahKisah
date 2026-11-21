import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, userByUsername } from "@/lib/auth";
import { countryBreakdown, diary, favorites, listsByUser, reviewsByUser } from "@/lib/queries";
import { achievementProgress } from "@/lib/rewards";
import { COUNTRIES, country } from "@/lib/regions";
import { Poster, Stars, Empty } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";
import { ListCard } from "@/components/ListCard";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const u = userByUsername((await params).username);
  return { title: u ? `${u.display_name} (@${u.username})` : "Profile" };
}

export default async function ProfilePage({ params }: { params: Params }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const favs = favorites(u.id);
  const recent = diary(u.id, 8);
  const reviews = reviewsByUser(u.id, viewer?.id ?? 0).slice(0, 3);
  const lists = listsByUser(u.id).slice(0, 2);
  const ach = achievementProgress(u.id).filter((a) => a.unlockedAt).sort((a, b) => (b.unlockedAt! > a.unlockedAt! ? 1 : -1));
  const byCountry = countryBreakdown(u.id);
  const seaVisited = new Set(byCountry.map((c) => c.country));
  const isMe = viewer?.id === u.id;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <section>
          <h2 className="section-title">Favourite films</h2>
          {favs.length ? (
            <div className="grid grid-cols-4 gap-3">
              {favs.map((f) => (
                <Poster key={f.id} film={f} />
              ))}
              {Array.from({ length: 4 - favs.length }).map((_, i) => (
                <div key={i} className="poster flex items-center justify-center border border-dashed border-line text-muted">
                  {isMe ? <Link href="/films" className="text-xs">＋ add</Link> : "—"}
                </div>
              ))}
            </div>
          ) : (
            <Empty>{isMe ? "Pick your top 4 from any film page." : "No favourites yet."}</Empty>
          )}
        </section>

        <section>
          <div className="section-title flex justify-between">
            <span>Recently watched</span>
            <Link href={`/u/${u.username}/diary`} className="normal-case tracking-normal hover:text-text">Diary →</Link>
          </div>
          {recent.length ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {recent.map((l) => (
                <div key={l.id}>
                  <Poster film={l} size="sm" />
                  <div className="mt-1 text-center text-xs">
                    <Stars rating={l.rating} />
                    {l.liked ? " ❤️" : ""}
                    {l.cinema_chain ? " 🎟️" : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Nothing logged yet.</Empty>
          )}
        </section>

        <section>
          <div className="section-title flex justify-between">
            <span>Recent reviews</span>
            <Link href={`/u/${u.username}/reviews`} className="normal-case tracking-normal hover:text-text">All →</Link>
          </div>
          <div className="space-y-3">
            {reviews.length ? reviews.map((r) => <ReviewCard key={r.id} r={r} viewerId={viewer?.id} />) : <Empty>No reviews yet.</Empty>}
          </div>
        </section>

        {lists.length > 0 && (
          <section>
            <h2 className="section-title">Catalogues</h2>
            <div className="space-y-3">
              {lists.map((l) => (
                <ListCard key={l.id} l={l} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-8">
        <section>
          <div className="section-title flex justify-between">
            <span>Achievements ({ach.length})</span>
            {isMe && <Link href="/achievements" className="normal-case tracking-normal hover:text-text">All →</Link>}
          </div>
          {ach.length ? (
            <div className="grid grid-cols-5 gap-2">
              {ach.slice(0, 15).map((a) => (
                <div key={a.id} className="card flex aspect-square items-center justify-center text-2xl" title={`${a.name}: ${a.description}`}>
                  {a.icon}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No achievements yet.</p>
          )}
        </section>

        <section>
          <h2 className="section-title">Passport · ASEAN stamps</h2>
          <div className="grid grid-cols-4 gap-2">
            {COUNTRIES.filter((c) => c.region === "sea").map((c) => (
              <div
                key={c.code}
                className={`flex flex-col items-center rounded-lg border p-2 text-center ${seaVisited.has(c.code) ? "border-saffron/60 bg-saffron/10" : "border-line opacity-40 grayscale"}`}
                title={c.name}
              >
                <span className="text-2xl">{c.flag}</span>
                <span className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-muted">{c.code}</span>
              </div>
            ))}
          </div>
        </section>

        {byCountry.length > 0 && (
          <section>
            <h2 className="section-title">Films by country</h2>
            <div className="space-y-1.5">
              {byCountry.slice(0, 8).map((b) => {
                const c = country(b.country);
                return (
                  <div key={b.country} className="flex items-center gap-2 text-sm">
                    <span className="w-6">{c?.flag}</span>
                    <span className="w-24 truncate text-muted">{c?.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-raised">
                      <div className="h-full bg-jade" style={{ width: `${(b.n / byCountry[0].n) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right">{b.n}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
