/** Pure mapping from stored (admin-made) items to catalogue items. Shared by server and the admin preview. */
import type { ItemType, Rarity, ShopItem } from "./shop";
import { THEME_TOKENS } from "./asset-spec.ts";

export const mediaUrl = (key: string) => `/media/${key}`;

export type CustomItemRow = {
  id: string; type: ItemType; name: string; description: string; rarity: Rarity; price: number | null;
  event: string | null; event_price: number | null; status: "draft" | "submitted" | "approved" | "live" | "retired";
  asset_key: string | null; data: string; artist: string; notes: string; created_at: string; updated_at: string; published_at: string | null;
  source: "staff" | "partner" | "artist"; campaign_id: number | null; brief_id: number | null; submitted_by: number | null; slot: string | null;
};

export type CustomData = {
  anim?: ShopItem["anim"];
  particles?: string[];
  motion?: ShopItem["motion"];
  theme?: Record<string, string>;
  gradient?: string[];
  shimmer?: boolean;
  text?: string;
};

export function parseData(raw: string): CustomData {
  try {
    return JSON.parse(raw) as CustomData;
  } catch {
    return {};
  }
}

/** Turn a stored row into a catalogue item that renders like any built-in one. */
export function toShopItem(r: Pick<CustomItemRow, "id" | "type" | "name" | "description" | "rarity" | "price" | "event" | "status" | "asset_key" | "data" | "artist">): ShopItem {
  const d = parseData(r.data);
  const img = r.asset_key ? mediaUrl(r.asset_key) : undefined;
  const base: ShopItem = {
    id: r.id, type: r.type, name: r.name, description: r.description, rarity: r.rarity,
    price: r.event ? null : r.price, event: r.event ?? undefined, value: "", custom: true,
    artist: r.artist || undefined, retired: r.status === "retired",
  };
  switch (r.type) {
    case "avatar":
      return { ...base, value: img ? `img:${img}` : "🙂", bg: "#1f232c" };
    case "sticker":
      return { ...base, value: img ? `img:${img}` : "🏷️", anim: d.anim };
    case "frame":
      return { ...base, value: "frame-custom", overlay: img };
    case "banner":
      return { ...base, value: "banner-custom", image: img };
    case "effect":
      return img ? { ...base, value: "custom", overlay: img } : { ...base, value: "custom", particles: d.particles?.length ? d.particles : ["✨"], motion: d.motion ?? "fall" };
    case "theme": {
      const t = d.theme ?? {};
      const vars = Object.fromEntries(THEME_TOKENS.filter((k) => t[k]).map((k) => [`--color-${k}`, t[k]]));
      return { ...base, value: `custom-${r.id}`, themeVars: vars, swatch: [t.ink ?? "#0e1014", t.surface ?? "#171a21", t.saffron ?? "#f5a524"] };
    }
    case "namestyle":
      return { ...base, value: "ns-custom", gradient: d.gradient, shimmer: d.shimmer };
    case "title":
      return { ...base, value: d.text || r.name };
  }
}


const NEEDS_ART: ItemType[] = ["avatar", "sticker", "frame", "banner"];

export type Draft = {
  type: ItemType; name: string; description: string; price: number | null; event: string | null; event_price: number | null;
  asset_key: string | null; assetOk: boolean; data: CustomData;
};

/** What must be true before an item can go live. Same list in the editor and on the server. */
export function readiness(d: Draft, colourChecksOk: boolean): { label: string; pass: boolean }[] {
  const out = [
    { label: "Name (2+ characters)", pass: d.name.trim().length >= 2 },
    { label: "Description (8+ characters)", pass: d.description.trim().length >= 8 },
    { label: "Sold for KP or offered in an event", pass: (d.price !== null && d.price > 0) || !!d.event },
  ];
  if (NEEDS_ART.includes(d.type)) out.push({ label: "Artwork uploaded and passing checks", pass: !!d.asset_key && d.assetOk });
  if (d.type === "effect") out.push({ label: "Animation uploaded, or particles chosen", pass: (!!d.asset_key && d.assetOk) || !!d.data.particles?.length });
  if (d.type === "theme" || d.type === "namestyle") out.push({ label: "Colour checks pass", pass: colourChecksOk });
  if (d.type === "title") out.push({ label: "Title text", pass: !!d.data.text?.trim() });
  return out;
}
