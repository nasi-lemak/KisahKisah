import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, userByUsername } from "@/lib/auth";
import { countryBreakdown, diary, favorites, inventory, lifetimePoints, reviewById, reviewsByUser } from "@/lib/queries";
import { COUNTRIES, REGIONS, country, regionOf } from "@/lib/regions";
import { ITEM_BY_ID, RARITY_STYLE } from "@/lib/shop";
import { SHOWCASES, collectionCount, collectionHighlights, parseShowcases, rarestAchievements, stickerBoard, type ShowcaseId } from "@/lib/profile";
import { EST_HOURS } from "@/lib/rewind";
import { all } from "@/lib/db";
import { Poster, Stars, Empty, KP } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";
import { StickerBoard } from "@/components/StickerBoard";
import { ItemPreview } from "@/components/ItemPreview";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const u = userByUsername((await params).username);
  return { title: u ? `${u.display_name} (@${u.username})` : "Profile" };
}

function Showcase({ id, children, action }: { id: ShowcaseId; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="glass overflow-hidden">
      <div className="showcase-head">
        <span>{SHOWCASES[id].icon}</span>
        {SHOWCASES[id].label}
        <span className="ml-auto text-sm font-normal">{action}</span>
      </div>
      {children}
    </section>
  );
}

export default async function ProfilePage({ params }: { params: Params }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const isMe = viewer?.id === u.id;
  const showcases = parseShowcases(u.showcases);
  const recent = diary(u.id, 8);
  const byCountry = countryBreakdown(u.id);
  const visited = new Set(byCountry.map((c) => c.country));
  const regionsVisited = new Set(byCountry.map((c) => regionOf(c.country)));

  const render = (id: ShowcaseId) => {
    switch (id) {
      case "favorites": {
        const favs = favorites(u.id);
        return (
          <Showcase key={id} id={id}>
            <div className="grid grid-cols-4 gap-3 p-4">
              {favs.map((f) => <Poster key={f.id} film={f} />)}
              {Array.from({ length: 4 - favs.length }).map((_, i) => (
                <div key={i} className="poster flex items-center justify-center border border-dashed border-line text-xs text-muted">
                  {isMe ? <Link href="/films">＋ add</Link> : "—"}
                </div>
              ))}
            </div>
          </Showcase>
        );
      }
      case "stickers": {
        const owned = isMe ? inventory(u.id).map((i) => ITEM_BY_ID[i]).filter((i) => i?.type === "sticker").map((i) => ({ id: i.id, name: i.name })) : [];
        return (
          <Showcase key={id} id={id}>
            <StickerBoard initial={stickerBoard(u.id).map(({ id: _id, ...s }) => s)} owned={owned} editable={isMe} />
          </Showcase>
        );
      }
      case "achievements": {
        const rare = rarestAchievements(u.id, 6);
        return (
          <Showcase key={id} id={id} action={<Link href="/achievements" className="text-muted hover:text-text">All →</Link>}>
            {rare.length ? (
              <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
                {rare.map((r) => (
                  <div key={r.achievement_id} className="flex items-center gap-3 rounded-xl bg-black/20 p-3" title={r.a.description}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--p1) 40%, transparent), color-mix(in srgb, var(--p2) 30%, transparent))" }}>
                      {r.a.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold">{r.a.name}</div>
                      <div className="text-xs text-muted">{r.pct}% of members</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-muted">No achievements yet.</p>
            )}
          </Showcase>
        );
      }
      case "collection": {
        const top = collectionHighlights(u.id, 6);
        const count = collectionCount(u.id);
        return (
          <Showcase key={id} id={id} action={<span className="text-muted">{count.total} items · {count.byRarity.legendary} legendary</span>}>
            <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
              {top.map((it) => (
                <div key={it.id} className="flex flex-col items-center gap-1 rounded-xl p-2 text-center" style={{ background: `linear-gradient(180deg, ${RARITY_STYLE[it.rarity].color}22, transparent)` }} title={it.description}>
                  <div className="flex h-16 w-full items-center justify-center overflow-hidden">
                    <ItemPreview item={it} avatar={u.avatar_item} compact displayName={u.display_name} />
                  </div>
                  <div className="line-clamp-1 text-xs font-semibold">{it.name}</div>
                </div>
              ))}
            </div>
          </Showcase>
        );
      }
      case "review": {
        const r = u.pinned_review_id ? reviewById(u.pinned_review_id, viewer?.id ?? 0) : reviewsByUser(u.id, viewer?.id ?? 0).sort((a, b) => b.like_count - a.like_count)[0];
        return (
          <Showcase key={id} id={id}>
            <div className="p-3">{r ? <ReviewCard r={r} viewerId={viewer?.id} /> : <p className="p-1 text-sm text-muted">No reviews yet.</p>}</div>
          </Showcase>
        );
      }
      case "stats": {
        const kinds = all<{ kind: string; n: number }>("SELECT f.kind, COUNT(DISTINCT f.id) n FROM logs l JOIN films f ON f.id = l.film_id WHERE l.user_id = ? GROUP BY f.kind", u.id);
        const films = kinds.find((k) => k.kind === "film")?.n ?? 0;
        const series = kinds.find((k) => k.kind === "series")?.n ?? 0;
        const tiles: [string, string | number][] = [
          ["Films", films], ["Series", series], ["≈ Hours", films * EST_HOURS.film + series * EST_HOURS.series],
          ["Countries", visited.size], ["Regions", regionsVisited.size], ["KP earned", lifetimePoints(u.id).toLocaleString()],
        ];
        return (
          <Showcase key={id} id={id}>
            <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-6">
              {tiles.map(([l, v]) => (
                <div key={l} className="rounded-xl bg-black/20 p-3 text-center">
                  <div className="font-display text-2xl font-extrabold">{v}</div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest text-muted">{l}</div>
                </div>
              ))}
            </div>
          </Showcase>
        );
      }
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {showcases.length === 0 && <Empty>No showcases yet.</Empty>}
        {showcases.map(render)}
        {isMe && (
          <Link href="/studio#showcases" className="glass block p-4 text-center text-sm text-muted hover:text-text">
            ＋ Add or reorder showcases in Profile Studio
          </Link>
        )}
      </div>

      <aside className="space-y-6">
        <section className="glass p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-bold">Recently watched</h2>
            <Link href={`/u/${u.username}/diary`} className="text-xs text-muted hover:text-text">Diary →</Link>
          </div>
          {recent.length ? (
            <div className="grid grid-cols-4 gap-2">
              {recent.map((l) => (
                <div key={l.id}>
                  <Poster film={l} size="sm" />
                  <div className="mt-0.5 text-center text-[0.65rem]">
                    <Stars rating={l.rating} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Nothing logged yet.</p>
          )}
        </section>

        <Link href={`/u/${u.username}/passport`} className="glass block p-4 transition hover:ring-1 hover:ring-saffron/50">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">🛂 Film Passport</h2>
            <span className="text-xs text-muted">Open →</span>
          </div>
          <p className="mt-1 text-xs text-muted">One stamp for every country {isMe ? "you've" : "they've"} watched a title from, worldwide.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-black/20 py-2">
              <div className="font-display text-xl font-extrabold">{visited.size}<span className="text-sm text-muted">/{COUNTRIES.length}</span></div>
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">Countries</div>
            </div>
            <div className="rounded-lg bg-black/20 py-2">
              <div className="font-display text-xl font-extrabold">{regionsVisited.size}<span className="text-sm text-muted">/{Object.keys(REGIONS).length}</span></div>
              <div className="text-[0.6rem] font-bold uppercase tracking-widest text-muted">Regions</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...visited].slice(0, 12).map((code) => (
              <span key={code} className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-double border-saffron/70 text-base" style={{ transform: `rotate(${(code.charCodeAt(1) % 9) - 4}deg)` }}>
                {country(code)?.flag}
              </span>
            ))}
          </div>
        </Link>

        {byCountry.length > 0 && (
          <section className="glass p-4">
            <h2 className="mb-3 font-display font-bold">Titles by country</h2>
            <div className="space-y-1.5">
              {byCountry.slice(0, 8).map((b) => {
                const c = country(b.country);
                return (
                  <div key={b.country} className="flex items-center gap-2 text-sm">
                    <span className="w-6">{c?.flag}</span>
                    <span className="w-24 truncate text-muted">{c?.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded bg-black/30">
                      <div className="h-full rounded" style={{ width: `${(b.n / byCountry[0].n) * 100}%`, background: "linear-gradient(90deg, var(--p1), var(--p2))" }} />
                    </div>
                    <span className="w-6 text-right">{b.n}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {isMe && (
          <section className="glass p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Your balance</span>
              <KP n={u.points} />
            </div>
            <Link href="/kedai" className="btn btn-ghost mt-3 w-full justify-center">Visit the Kedai</Link>
          </section>
        )}
      </aside>
    </div>
  );
}
