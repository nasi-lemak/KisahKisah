"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { buyItem, saveStudio, type StudioPayload } from "@/app/actions";
import type { CardData } from "@/lib/profile";
import type { ShopItem } from "@/lib/shop";
import { RARITY_STYLE } from "@/lib/shop";
import { ProfileCard } from "./ProfileCard";
import { ItemPreview } from "./ItemPreview";
import { themeStyle } from "./ui";
import { toast } from "./Toaster";
import { rain } from "./EasterEggs";

type Slot = "avatar" | "frame" | "effect" | "namestyle" | "banner" | "title" | "theme";
const SLOTS: { id: Slot; label: string; icon: string; optional: boolean }[] = [
  { id: "avatar", label: "Avatar", icon: "🙂", optional: false },
  { id: "frame", label: "Decoration", icon: "💫", optional: true },
  { id: "effect", label: "Profile effect", icon: "✨", optional: true },
  { id: "namestyle", label: "Name style", icon: "🔤", optional: true },
  { id: "banner", label: "Banner", icon: "🖼️", optional: true },
  { id: "title", label: "Title", icon: "🏷️", optional: true },
  { id: "theme", label: "App theme", icon: "🎨", optional: true },
];

const PRESETS: [string, string, string][] = [
  ["Teh Tarik", "#d4a373", "#78350f"], ["Pandan", "#4ade80", "#166534"], ["Senja", "#fb923c", "#db2777"], ["Bunga Raya", "#e11d48", "#fb7185"],
  ["Jade", "#34d399", "#0e7490"], ["Tanglung", "#f59e0b", "#b91c1c"], ["Monsoon", "#64748b", "#1e3a8a"], ["Ube", "#a78bfa", "#6d28d9"],
];

const SHOWCASE_LABELS: Record<string, string> = {
  favorites: "🎞️ Favourite films", stickers: "🏷️ Sticker board", achievements: "🏆 Rarest achievements",
  collection: "💎 Collection", review: "📝 Featured review", stats: "📊 By the numbers",
};

export function StudioEditor({ base, items, owned, points, reviews }: {
  base: CardData & { theme_item: string | null; showcases: string[]; pinned_review_id: number | null };
  items: ShopItem[];
  owned: string[];
  points: number;
  reviews: { id: number; title: string }[];
}) {
  const ownedSet = useMemo(() => new Set(owned), [owned]);
  const [tab, setTab] = useState<Slot | "colors" | "showcases">("frame");
  const [sel, setSel] = useState<Record<Slot, string | null>>({
    avatar: base.avatar_item, frame: base.frame_item, effect: base.effect_item, namestyle: base.namestyle_item,
    banner: base.banner_item, title: base.title_item, theme: base.theme_item,
  });
  const [a1, setA1] = useState(base.accent1 ?? "#f5a524");
  const [a2, setA2] = useState(base.accent2 ?? "#19b38a");
  const [showcases, setShowcases] = useState<string[]>(base.showcases);
  const [pinned, setPinned] = useState<number | null>(base.pinned_review_id);
  const [bio, setBio] = useState(base.bio);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (window.location.hash === "#showcases") setTab("showcases");
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const previews = (Object.entries(sel) as [Slot, string | null][]).filter(([, id]) => id && !ownedSet.has(id)).map(([, id]) => byId.get(id!)!).filter(Boolean);
  const card: CardData = {
    ...base, bio, avatar_item: sel.avatar ?? base.avatar_item, frame_item: sel.frame, effect_item: sel.effect, namestyle_item: sel.namestyle,
    banner_item: sel.banner, title_item: sel.title, accent1: a1, accent2: a2,
  };
  const themeValue = sel.theme ? byId.get(sel.theme)?.value : undefined;

  const save = () =>
    start(async () => {
      const payload: StudioPayload = {
        avatar: sel.avatar ?? base.avatar_item, frame: sel.frame, banner: sel.banner, title: sel.title, theme: sel.theme,
        effect: sel.effect, namestyle: sel.namestyle, accent1: a1, accent2: a2, showcases, pinnedReviewId: pinned, bio,
      };
      const r = await saveStudio(payload);
      if (r?.error) toast({ icon: "⚠️", title: r.error });
      else {
        toast({ icon: "🎨", title: "Profile saved!", body: "Looking good.", kind: "achievement" });
        rain(["✨", "💫", "⭐"], 25);
      }
    });

  const buy = (it: ShopItem) =>
    start(async () => {
      const r = await buyItem(it.id);
      if (r?.error) toast({ icon: "⚠️", title: r.error });
      if (r?.ok) toast({ icon: "🛍️", title: r.ok });
    });

  const moveShowcase = (i: number, d: number) =>
    setShowcases((xs) => {
      const n = [...xs];
      const j = i + d;
      if (j < 0 || j >= n.length) return xs;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const slotItems = (slot: Slot) =>
    items
      .filter((i) => i.type === slot && (!i.retired || ownedSet.has(i.id)))
      .sort((a, b) => Number(ownedSet.has(b.id)) - Number(ownedSet.has(a.id)) || (a.price ?? 99999) - (b.price ?? 99999));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="min-w-0 space-y-4">
        <div className="glass flex gap-1 overflow-x-auto p-1.5">
          {[...SLOTS.map((s) => [s.id, `${s.icon} ${s.label}`]), ["colors", "🌈 Colours"], ["showcases", "🧩 Showcases & bio"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id as Slot)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === id ? "bg-saffron text-ink" : "text-muted hover:bg-raised hover:text-text"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {SLOTS.some((s) => s.id === tab) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {SLOTS.find((s) => s.id === tab)!.optional && (
              <button onClick={() => setSel((x) => ({ ...x, [tab]: null }))} className={`glass flex min-h-40 flex-col items-center justify-center gap-2 p-3 text-sm ${sel[tab as Slot] === null ? "ring-2 ring-saffron" : ""}`}>
                <span className="text-3xl opacity-50">⦸</span>
                None
              </button>
            )}
            {slotItems(tab as Slot).map((it) => {
              const have = ownedSet.has(it.id);
              const on = sel[tab as Slot] === it.id;
              const rc = RARITY_STYLE[it.rarity].color;
              return (
                <button
                  key={it.id}
                  onClick={() => setSel((x) => ({ ...x, [tab]: it.id }))}
                  className={`relative flex min-h-40 flex-col items-center gap-2 overflow-hidden rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 ${on ? "ring-2 ring-saffron" : ""}`}
                  style={{ borderColor: `${rc}55`, background: `linear-gradient(180deg, ${rc}1f, var(--color-surface) 65%)` }}
                >
                  {!have && <span className="absolute right-2 top-2 text-xs" title="Not owned yet">🔒</span>}
                  <div className="flex h-24 w-full items-center justify-center">
                    <ItemPreview item={it} avatar={sel.avatar ?? base.avatar_item} displayName={base.display_name} compact />
                  </div>
                  <div className="text-sm font-semibold leading-tight">{it.name}</div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: rc }}>
                    {have ? "Owned" : it.price === null ? (it.event ? "Event exclusive" : "Earn it") : `🪙 ${it.price}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === "colors" && (
          <div className="glass space-y-4 p-5">
            <p className="text-sm text-muted">Profile colours tint your card, banner glow, showcases and level bar, like Nitro profile themes.</p>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="color" value={a1} onChange={(e) => setA1(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-line bg-transparent" aria-label="Primary colour" /> Primary
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="color" value={a2} onChange={(e) => setA2(e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-line bg-transparent" aria-label="Accent colour" /> Accent
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map(([name, c1, c2]) => (
                <button key={name} onClick={() => { setA1(c1); setA2(c2); }} className="flex items-center gap-2 rounded-xl border border-line p-2 text-sm hover:border-saffron">
                  <span className="h-7 w-7 rounded-lg" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "showcases" && (
          <div id="showcases" className="glass space-y-5 p-5">
            <div>
              <h3 className="font-display font-bold">Showcases</h3>
              <p className="text-sm text-muted">Pick what appears on your profile, and in what order, like a Steam profile.</p>
              <div className="mt-3 space-y-1.5">
                {Object.keys(SHOWCASE_LABELS).map((id) => {
                  const i = showcases.indexOf(id);
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-sm">
                      <input type="checkbox" checked={i >= 0} onChange={(e) => setShowcases((xs) => (e.target.checked ? [...xs, id] : xs.filter((x) => x !== id)))} aria-label={SHOWCASE_LABELS[id]} />
                      <span className="flex-1">{SHOWCASE_LABELS[id]}</span>
                      {i >= 0 && (
                        <>
                          <span className="text-xs text-muted">#{i + 1}</span>
                          <button onClick={() => moveShowcase(i, -1)} className="px-1 text-muted hover:text-text" aria-label="Move up">↑</button>
                          <button onClick={() => moveShowcase(i, 1)} className="px-1 text-muted hover:text-text" aria-label="Move down">↓</button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="pinned">Featured review</label>
              <select id="pinned" className="input" value={pinned ?? ""} onChange={(e) => setPinned(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Most liked (automatic)</option>
                {reviews.map((r) => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="studio-bio">About me</label>
              <textarea id="studio-bio" className="input min-h-24" maxLength={400} value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold uppercase tracking-widest text-muted">Live preview</span>
          <span className="text-saffron">🪙 {points.toLocaleString()} KP</span>
        </div>
        <div data-theme={themeValue} style={themeStyle(sel.theme)} className="rounded-2xl bg-ink p-2">
          <ProfileCard p={card} />
        </div>
        {previews.length > 0 && (
          <div className="mt-3 rounded-xl border border-saffron/50 bg-saffron/10 p-3 text-sm">
            <div className="font-semibold">You&apos;re trying on items you don&apos;t own yet</div>
            <ul className="mt-2 space-y-1.5">
              {previews.map((it) => (
                <li key={it.id} className="flex items-center gap-2">
                  <span className="flex-1">{it.name}</span>
                  {it.price !== null ? (
                    <button className="btn btn-primary py-1 text-xs" disabled={pending || points < it.price} onClick={() => buy(it)}>🪙 {it.price}</button>
                  ) : (
                    <Link href={it.event ? `/events/${it.event}` : "/achievements"} className="text-xs text-saffron">{it.event ? "From an event →" : "Earn it →"}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary flex-1 justify-center" onClick={save} disabled={pending || previews.length > 0}>
            {pending ? "Saving…" : previews.length ? "Get previewed items to save" : "Save profile"}
          </button>
          <Link href={`/u/${base.username}`} className="btn btn-ghost">View</Link>
        </div>
      </aside>
    </div>
  );
}
