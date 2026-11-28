import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { inventory, ledger, lifetimePoints } from "@/lib/queries";
import { BUNDLES, ITEMS, ITEM_BY_ID, RARITY_STYLE, bundlePrice, type ItemType, type ShopItem } from "@/lib/shop";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { activeEvents, nextOfferFor } from "@/lib/events";
import { audience } from "@/lib/geo";
import { levelFromXp } from "@/lib/levels";
import { BuyButton } from "@/components/forms";
import { BundleButton, ClaimButton } from "@/components/EventBits";
import { ItemPreview } from "@/components/ItemPreview";
import { ProfileCard } from "@/components/ProfileCard";
import { KP, timeAgo } from "@/components/ui";
import type { CardData } from "@/lib/profile";

export const metadata: Metadata = { title: "Kedai · Shop" };

const SECTION_TYPES = [
  { type: "frame", icon: "💫" },
  { type: "effect", icon: "✨" },
  { type: "namestyle", icon: "🔤" },
  { type: "avatar", icon: "🙂" },
  { type: "banner", icon: "🖼️" },
  { type: "theme", icon: "🎨" },
  { type: "sticker", icon: "🏷️" },
  { type: "title", icon: "🎖️" },
] as const satisfies readonly { type: ItemType; icon: string }[];

const NEW_TYPES = new Set<ItemType>(["effect", "namestyle"]);
const NEW_IDS = new Set(["fr_bungaraya", "fr_lanterns", "fr_kucing", "fr_kopi", "fr_wau", "fr_durian"]);


function ShopCard({ item, children, avatar, name, newLabel = "New" }: { item: ShopItem; children: React.ReactNode; avatar?: string; name: string; newLabel?: string }) {
  const rc = RARITY_STYLE[item.rarity].color;
  const isNew = NEW_TYPES.has(item.type) || NEW_IDS.has(item.id);
  return (
    <div className={`shop-card ${item.rarity === "legendary" ? "legendary" : ""}`} style={{ ["--r1" as string]: rc, ["--r2" as string]: `${rc}55` }}>
      <div className="inner flex flex-col gap-2 p-4">
        {isNew && <span className="ribbon bg-jade">{newLabel}</span>}
        <div className="flex h-28 items-center justify-center">
          <ItemPreview item={item} avatar={avatar} displayName={name} />
        </div>
        <div className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: rc }}>{RARITY_STYLE[item.rarity].label}</div>
        <div className="font-display text-base font-bold leading-tight">{item.name}</div>
        <p className="line-clamp-2 text-xs text-muted">{item.description}</p>
        {item.artist && <p className="text-[0.7rem] text-lotus">🎨 Art by {item.artist}</p>}
        <div className="mt-auto pt-1">{children}</div>
      </div>
    </div>
  );
}

export default async function KedaiPage() {
  const { t, date, locale } = await getI18n();
  const fmt = (d: string) => date(d, "medium");
  const SECTIONS = SECTION_TYPES.map((x) => ({ ...x, title: t(`kedai.sec.${x.type}`), blurb: t(`kedai.sec.${x.type}Hint`) }));
  const user = await currentUser();
  const owned = new Set(user ? inventory(user.id) : []);
  const history = user ? ledger(user.id, 10) : [];
  const source = new Map(ACHIEVEMENTS.filter((a) => a.reward).map((a) => [a.reward!, a]));
  const live = activeEvents(undefined, await audience()).filter((e) => e.offers.length);
  const vaulted = ITEMS.filter((i) => i.event && !i.retired && !live.some((e) => e.offers.some((o) => o.item === i.id)));
  const avatar = user?.avatar_item;
  const name = user?.display_name ?? t("kedai.yourName");

  const bundleCard = (b: (typeof BUNDLES)[number]): CardData => {
    const pick = (t: ItemType) => b.items.find((i) => ITEM_BY_ID[i]?.type === t) ?? null;
    return {
      username: user?.username ?? "you", display_name: name, bio: b.blurb, home_country: user?.home_country ?? "MY",
      avatar_item: pick("avatar") ?? avatar ?? "av_popcorn", frame_item: pick("frame"), banner_item: pick("banner"), title_item: pick("title"),
      effect_item: pick("effect"), namestyle_item: pick("namestyle"), accent1: b.colors[1], accent2: b.colors[0],
      level: levelFromXp(user ? lifetimePoints(user.id) : 0), badges: [], since: new Date().toISOString().slice(0, 10),
    };
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-line p-7 sm:p-10" style={{ background: "radial-gradient(circle at 15% 20%, #f5a52455, transparent 45%), radial-gradient(circle at 85% 80%, #c084fc44, transparent 45%), radial-gradient(circle at 60% 10%, #19b38a33, transparent 40%), var(--color-surface)" }}>
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted">{t("kedai.title")}</div>
            <h1 className="mt-1 font-display text-5xl font-extrabold sm:text-6xl">{t("kedai.lead")}</h1>
            <p className="mt-2 max-w-xl text-muted">{t("kedai.body")}</p>
          </div>
          {user ? (
            <div className="glass flex items-center gap-4 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted">{t("kedai.balance")}</div>
                <KP n={user.points} className="text-2xl" />
              </div>
              <Link href="/studio" className="btn btn-primary">{t("kedai.studio")}</Link>
            </div>
          ) : (
            <Link href="/login?next=/kedai" className="btn btn-primary">{t("kedai.signIn")}</Link>
          )}
        </div>
      </section>

      {/* Limited-time drops */}
      {live.map((e) => (
        <section key={e.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: `${e.colors[0]}88` }}>
          <div className="flex flex-wrap items-center gap-3 px-5 py-3" style={{ background: `linear-gradient(90deg, ${e.colors[0]}55, ${e.colors[1]}33)` }}>
            <span className="text-2xl">{e.icon}</span>
            <div>
              <div className="font-display font-bold">
                Limited drop · {e.name}
                {e.kind === "sponsored" && <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider">{t("kedai.sponsored")}</span>}
              </div>
              <div className="text-xs text-muted">{e.daysLeft === 1 ? t("kedai.vaultedInOne") : t("kedai.vaultedInMany", { n: e.daysLeft })}</div>
            </div>
            <Link href={`/events/${e.id}`} className="ml-auto text-sm text-muted hover:text-text">{t("kedai.eventPage")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-surface p-4 sm:grid-cols-4 lg:grid-cols-5">
            {e.offers.map((o) => {
              const item = ITEM_BY_ID[o.item];
              if (!item) return null;
              return (
                <ShopCard newLabel={t("kedai.new")} key={o.item} item={item} avatar={avatar} name={name}>
                  <ClaimButton eventId={e.id} itemId={item.id} price={o.price} owned={owned.has(item.id)} affordable={(user?.points ?? 0) >= o.price} live signedIn={!!user} />
                </ShopCard>
              );
            })}
          </div>
        </section>
      ))}

      {/* Bundles */}
      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold">{t("kedai.bundles")}</h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {BUNDLES.map((b) => {
            const total = b.items.reduce((a, id) => a + (ITEM_BY_ID[id]?.price ?? 0), 0);
            const price = bundlePrice(b, owned);
            const all = b.items.every((i) => owned.has(i));
            return (
              <article key={b.id} className="overflow-hidden rounded-3xl border border-line" style={{ background: `linear-gradient(160deg, ${b.colors[0]}, ${b.colors[1]}33 60%, var(--color-surface))` }}>
                <div className="p-4 pb-0">
                  <ProfileCard p={bundleCard(b)} variant="mini" t={t} locale={locale} />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl font-extrabold">{b.name}</h3>
                    <span className="text-sm text-muted line-through">🪙 {total.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.items.map((id) => (
                      <span key={id} className={`chip py-0.5 text-xs ${owned.has(id) ? "opacity-50" : ""}`}>
                        {owned.has(id) ? "✓ " : ""}
                        {ITEM_BY_ID[id]?.name}
                      </span>
                    ))}
                  </div>
                  <BundleButton bundleId={b.id} price={price} owned={all} affordable={(user?.points ?? 0) >= price} signedIn={!!user} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Category nav */}
      <nav className="glass sticky top-[72px] z-30 flex gap-1 overflow-x-auto p-1.5">
        {SECTIONS.map((s) => (
          <a key={s.type} href={`#${s.type}`} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted hover:bg-raised hover:text-text">
            {s.icon} {s.title}
          </a>
        ))}
      </nav>

      {SECTIONS.map((s) => {
        const list = ITEMS.filter((i) => i.type === s.type && !i.starter && !i.event && !i.retired);
        return (
          <section key={s.type} id={s.type} className="scroll-mt-36">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="font-display text-2xl font-extrabold">{s.icon} {s.title}</h2>
              <span className="text-sm text-muted">{s.blurb}</span>
            </div>
            <div className={`grid gap-4 ${s.type === "banner" || s.type === "theme" || s.type === "effect" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
              {list.map((item) => {
                const ach = source.get(item.id);
                return (
                  <ShopCard newLabel={t("kedai.new")} key={item.id} item={item} avatar={avatar} name={name}>
                    {owned.has(item.id) ? (
                      <Link href="/studio" className="block rounded-lg bg-jade/15 py-1.5 text-center text-sm font-bold text-jade">{t("kedai.owned")}</Link>
                    ) : item.price === null ? (
                      <span className="block rounded-lg bg-raised py-1.5 text-center text-xs text-muted">🔒 {ach ? (ach.hidden ? t("kedai.secret") : t("kedai.earn", { name: ach.name })) : t("kedai.earnOnly")}</span>
                    ) : user ? (
                      <BuyButton itemId={item.id} price={item.price} affordable={user.points >= item.price} />
                    ) : (
                      <span className="block py-1.5 text-center text-sm font-bold text-saffron">🪙 {item.price.toLocaleString()}</span>
                    )}
                  </ShopCard>
                );
              })}
            </div>
          </section>
        );
      })}

      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-extrabold">{t("kedai.vault")}</h2>
          <span className="text-sm text-muted">{t("kedai.exclusives")}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {vaulted.map((item) => {
            const next = nextOfferFor(item.id);
            return (
              <div key={item.id} className={`glass flex flex-col items-center gap-1.5 p-3 text-center ${owned.has(item.id) ? "" : "opacity-75"}`}>
                <div className="flex h-16 w-full items-center justify-center">
                  <ItemPreview item={item} avatar={avatar} displayName={name} compact />
                </div>
                <div className="text-xs font-semibold">{item.name}</div>
                <div className="text-[0.65rem] text-muted">
                  {owned.has(item.id) ? t("kedai.inCollection") : next ? t("kedai.returns", { date: fmt(next.start) }) : t("kedai.retired")}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {user && history.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{t("kedai.history")}</h2>
          <div className="glass divide-y divide-line">
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
