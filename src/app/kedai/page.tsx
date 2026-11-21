import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { inventory, ledger } from "@/lib/queries";
import { ITEMS, RARITY_STYLE, type ItemType } from "@/lib/shop";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { BuyButton } from "@/components/forms";
import { ItemPreview, RarityTag } from "@/components/ItemPreview";
import { KP, timeAgo } from "@/components/ui";

export const metadata: Metadata = { title: "Kedai · Points Shop" };

const SECTIONS: { type: ItemType; title: string; blurb: string }[] = [
  { type: "avatar", title: "Avatars", blurb: "Who you are on KisahKisah." },
  { type: "frame", title: "Avatar frames", blurb: "Woven, waxed, polished or glowing." },
  { type: "banner", title: "Profile banners", blurb: "The backdrop to your kisah." },
  { type: "title", title: "Titles", blurb: "Shown beside your name on every review." },
];

export default async function KedaiPage() {
  const user = await currentUser();
  const owned = new Set(user ? inventory(user.id) : []);
  const history = user ? ledger(user.id, 12) : [];
  const source = new Map(ACHIEVEMENTS.filter((a) => a.reward).map((a) => [a.reward!, a]));

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

      {SECTIONS.map((s) => (
        <section key={s.type}>
          <h2 className="section-title">{s.title} <span className="normal-case tracking-normal">· {s.blurb}</span></h2>
          <div className={`grid gap-3 ${s.type === "banner" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
            {ITEMS.filter((i) => i.type === s.type && !i.starter).map((item) => {
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
