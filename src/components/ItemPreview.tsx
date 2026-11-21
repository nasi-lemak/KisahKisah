import type { ShopItem } from "@/lib/shop";
import { RARITY_STYLE } from "@/lib/shop";
import { Avatar, AvatarGlyph, ProfileEffect, Sticker } from "./ui";

/** Renders any cosmetic the way it looks in use, on the viewer's own avatar/name where relevant. */
export function ItemPreview({ item, avatar, displayName = "Your Name", compact = false }: { item: ShopItem; avatar?: string; displayName?: string; compact?: boolean }) {
  const s = compact ? 0.7 : 1;
  switch (item.type) {
    case "avatar":
      return (
        <span className="inline-flex items-center justify-center rounded-full shadow-lg" style={{ width: 84 * s, height: 84 * s, background: item.bg }}>
          <AvatarGlyph value={item.value} px={84 * s} />
        </span>
      );
    case "frame":
      return <Avatar item={avatar ?? "av_popcorn"} frame={item.id} size={64 * s} />;
    case "banner":
      return <div className={`banner w-full rounded-md ${item.value}`} style={{ height: 80 * s }} />;
    case "title":
      return <span className="rounded-md bg-black/30 px-2.5 py-1 text-sm font-semibold italic text-lotus">{item.value}</span>;
    case "sticker":
      return <Sticker id={item.id} size={52 * s} />;
    case "namestyle":
      return <span className={`${item.value} font-display font-extrabold`} style={{ fontSize: 22 * s }}>{displayName}</span>;
    case "effect":
      return (
        <div className="relative w-full overflow-hidden rounded-md bg-gradient-to-b from-black/40 to-black/10" style={{ height: 84 * s }}>
          <ProfileEffect effect={item.id} count={10} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar item={avatar ?? "av_popcorn"} size={44 * s} />
          </div>
        </div>
      );
    case "theme": {
      const [bg, surface, accent] = item.swatch ?? ["#0e1014", "#171a21", "#f5a524"];
      return (
        <div className="w-full overflow-hidden rounded-md border border-white/10 p-2" style={{ background: bg, height: 80 * s }}>
          <div className="h-2.5 w-1/2 rounded" style={{ background: accent }} />
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 rounded" style={{ background: surface, height: 36 * s }} />
            ))}
          </div>
        </div>
      );
    }
  }
}

export function RarityTag({ item }: { item: ShopItem }) {
  const r = RARITY_STYLE[item.rarity];
  return (
    <span className="text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: r.color }}>
      {r.label}
    </span>
  );
}
