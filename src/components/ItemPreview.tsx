import type { ShopItem } from "@/lib/shop";
import { RARITY_STYLE } from "@/lib/shop";
import { Avatar, AvatarGlyph } from "./ui";

export function ItemPreview({ item, avatar }: { item: ShopItem; avatar?: string }) {
  switch (item.type) {
    case "avatar":
      return (
        <span className="inline-flex h-20 w-20 items-center justify-center rounded-full" style={{ background: item.bg }}>
          <AvatarGlyph value={item.value} px={80} />
        </span>
      );
    case "frame":
      return <Avatar item={avatar ?? "av_popcorn"} frame={item.id} size={72} />;
    case "banner":
      return <div className={`banner h-20 w-full rounded-md ${item.value}`} />;
    case "title":
      return <span className="chip border-lotus/50 px-3 py-1 text-sm italic text-lotus">{item.value}</span>;
    case "sticker":
      return (
        <span className="inline-flex h-20 w-20 rotate-[-6deg] items-center justify-center rounded-2xl border-4 border-white/90 bg-white/5 shadow-lg">
          <AvatarGlyph value={item.value} px={90} />
        </span>
      );
    case "theme": {
      const [bg, surface, accent] = item.swatch ?? ["#0e1014", "#171a21", "#f5a524"];
      return (
        <div className="h-20 w-full overflow-hidden rounded-md border border-white/10 p-2" style={{ background: bg }}>
          <div className="h-2.5 w-1/2 rounded" style={{ background: accent }} />
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 flex-1 rounded" style={{ background: surface }} />
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
