import "server-only";
import { all } from "./db";
import { ITEM_BY_ID, registerItems, type ShopItem } from "./shop";
import { registerExtraOffers, type Offer } from "./events";
import { toShopItem, type CustomItemRow } from "./custom-item-map";

export { toShopItem, parseData, type CustomItemRow, type CustomData } from "./custom-item-map";

/** Items customers can see/own: live and retired. */
export function liveCustomItems(): ShopItem[] {
  return all<CustomItemRow>("SELECT * FROM custom_items WHERE status IN ('live', 'retired') ORDER BY published_at").map(toShopItem);
}

/** Load published custom items into this runtime's catalogue (and their event offers). */
export function syncCustomItems(): ShopItem[] {
  const items = liveCustomItems();
  registerItems(items);
  // Items that were un-published since last sync: hide them from the shop.
  for (const it of Object.values(ITEM_BY_ID)) if (it.custom && !items.some((x) => x.id === it.id)) it.retired = true;
  const offers: Record<string, Offer[]> = {};
  for (const r of all<CustomItemRow>("SELECT id, event, event_price FROM custom_items WHERE status = 'live' AND event IS NOT NULL")) {
    (offers[r.event!] ??= []).push({ item: r.id, price: r.event_price ?? 0 });
  }
  registerExtraOffers(offers);
  return items;
}
