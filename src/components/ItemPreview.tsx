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
