import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { inventory, ledger } from "@/lib/queries";
import { ITEMS, ITEM_BY_ID, RARITY_STYLE, type ItemType } from "@/lib/shop";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { BuyButton } from "@/components/forms";
import { ItemPreview, RarityTag } from "@/components/ItemPreview";
import { KP, timeAgo } from "@/components/ui";
import { activeEvents, nextOfferFor } from "@/lib/events";
import { ClaimButton } from "@/components/EventBits";

export const metadata: Metadata = { title: "Kedai · Points Shop" };

const SECTIONS: { type: ItemType; title: string; blurb: string }[] = [
  { type: "avatar", title: "Avatars", blurb: "Who you are on KisahKisah." },
  { type: "frame", title: "Avatar frames", blurb: "Woven, waxed, polished or glowing." },
  { type: "banner", title: "Profile banners", blurb: "The backdrop to your kisah." },
  { type: "title", title: "Titles", blurb: "Shown beside your name on every review." },
  { type: "theme", title: "Site themes", blurb: "Recolour the whole app, just for you." },
  { type: "sticker", title: "Stickers", blurb: "Slap them on reviews you love (or hate)." },
];

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function KedaiPage() {
  const user = await currentUser();
  const owned = new Set(user ? inventory(user.id) : []);
  const history = user ? ledger(user.id, 12) : [];
  const source = new Map(ACHIEVEMENTS.filter((a) => a.reward).map((a) => [a.reward!, a]));
  const live = activeEvents().filter((e) => e.offers.length);
  const vaulted = ITEMS.filter((i) => i.event && !live.some((e) => e.offers.some((o) => o.item === i.id)));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Kedai 🏪</h1>
          <p className="text-muted">The corner shop for cosmetics. Spend Kisah Points (KP) earned by logging, reviewing, playing and going to the cinema.</p>
        </div>
        {user ? (
          <div className="card flex items-center gap-4 px-5 py-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Your balance</div>
              <KP n={user.points} className="text-2xl" />
            </div>
            <Link href="/kedai/inventory" className="btn btn-ghost">Inventory →</Link>
          </div>
        ) : (
          <Link href="/login?next=/kedai" className="btn btn-primary">Sign in to shop</Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.values(RARITY_STYLE).map((r) => (
          <span key={r.label} className="chip" style={{ borderColor: r.color, color: r.color }}>{r.label}</span>
        ))}
        <span className="chip">🔒 Earn-only: unlocked through achievements & secrets</span>
      </div>

      {live.map((e) => (
        <section key={e.id} className="overflow-hidden rounded-xl border border-saffron/40">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3" style={{ background: `linear-gradient(90deg, ${e.colors[0]}55, ${e.colors[1]}33)` }}>
            <span className="text-2xl">{e.icon}</span>
            <div>
              <div className="font-bold">
                Limited time: {e.name}
                {e.kind === "sponsored" && <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider">Sponsored</span>}
              </div>
              <div className="text-xs text-muted">Vaulted in {e.daysLeft} day{e.daysLeft === 1 ? "" : "s"}. Grab them while you can.</div>
            </div>
            <Link href={`/events/${e.id}`} className="ml-auto text-sm text-muted hover:text-text">Event page →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-surface p-4 sm:grid-cols-4 lg:grid-cols-6">
            {e.offers.map((o) => {
              const item = ITEM_BY_ID[o.item];
              if (!item) return null;
              return (
                <div key={o.item} className="flex flex-col items-center gap-2 text-center">
                  <div className="flex h-20 w-full items-center justify-center">
                    <ItemPreview item={item} avatar={user?.avatar_item} />
                  </div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <ClaimButton eventId={e.id} itemId={item.id} price={o.price} owned={owned.has(item.id)} affordable={(user?.points ?? 0) >= o.price} live signedIn={!!user} />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {SECTIONS.map((s) => (
        <section key={s.type}>
          <h2 className="section-title">{s.title} <span className="normal-case tracking-normal">· {s.blurb}</span></h2>
          <div className={`grid gap-3 ${s.type === "banner" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
            {ITEMS.filter((i) => i.type === s.type && !i.starter && !i.event).map((item) => {
              const have = owned.has(item.id);
              const ach = source.get(item.id);
              return (
                <div key={item.id} className="card flex flex-col items-center gap-2 p-4 text-center" style={{ borderColor: `${RARITY_STYLE[item.rarity].color}44` }}>
                  <div className="flex h-24 w-full items-center justify-center">
                    <ItemPreview item={item} avatar={user?.avatar_item} />
                  </div>
                  <RarityTag item={item} />
                  <div className="font-semibold leading-tight">{item.name}</div>
                  <p className="text-xs text-muted">{item.description}</p>
                  <div className="mt-auto w-full pt-2">
                    {have ? (
                      <span className="block rounded-md bg-jade/15 py-1.5 text-sm font-semibold text-jade">✓ Owned</span>
                    ) : item.price === null ? (
                      <span className="block rounded-md bg-raised py-1.5 text-xs text-muted">
                        🔒 {ach ? (ach.hidden ? "Secret achievement" : `Earn “${ach.name}”`) : "Earn-only"}
                      </span>
                    ) : user ? (
                      <BuyButton itemId={item.id} price={item.price} affordable={user.points >= item.price} />
                    ) : (
                      <span className="block py-1.5 text-sm font-semibold text-saffron">🪙 {item.price.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section>
        <h2 className="section-title">🔐 The Vault <span className="normal-case tracking-normal">· event exclusives, back when their event returns</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {vaulted.map((item) => {
            const next = nextOfferFor(item.id);
            return (
              <div key={item.id} className={`card flex flex-col items-center gap-1.5 p-3 text-center ${owned.has(item.id) ? "" : "opacity-70"}`}>
                <div className="flex h-16 w-full items-center justify-center grayscale-[40%]">
                  <ItemPreview item={item} avatar={user?.avatar_item} />
                </div>
                <div className="text-xs font-semibold">{item.name}</div>
                <div className="text-[0.65rem] text-muted">
                  {owned.has(item.id) ? "✓ In your collection" : next ? `Returns ${fmt(next.start)} · ${next.event.name}` : "Retired"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {user && history.length > 0 && (
        <section>
          <h2 className="section-title">KP history</h2>
          <div className="card divide-y divide-line">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className={`w-16 font-mono font-bold ${h.delta >= 0 ? "text-jade" : "text-chili"}`}>{h.delta >= 0 ? "+" : ""}{h.delta}</span>
                <span className="flex-1">{h.label}</span>
                <span className="text-xs text-muted">{timeAgo(h.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
