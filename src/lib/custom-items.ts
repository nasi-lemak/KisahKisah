import "server-only";
import { all } from "./db";
import { ITEM_BY_ID, registerItems, type ShopItem } from "./shop";
import { registerExtraEvents, registerExtraOffers, type Offer } from "./events";
import { campaignToEvent, houseToEvent, type HouseEventRow } from "./workflow";
import { country } from "./regions";
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
  // A campaign's ticket reward is only for ticket holders, never a free or KP drop.
  const ticketOnly = new Set(all<{ ticket_item: string }>("SELECT ticket_item FROM campaigns WHERE ticket_item IS NOT NULL").map((r) => r.ticket_item));
  for (const r of all<CustomItemRow>("SELECT id, event, event_price FROM custom_items WHERE status = 'live' AND event IS NOT NULL")) {
    if (ticketOnly.has(r.id)) continue;
    (offers[r.event!] ??= []).push({ item: r.id, price: r.event_price ?? 0 });
  }
  registerExtraOffers(offers);
  // Scheduled partner campaigns run as sponsored events; admin-made house events join the calendar.
  registerExtraEvents([
    ...all<HouseEventRow>("SELECT * FROM house_events WHERE enabled = 1").map((r) => houseToEvent(r, (c) => country(c)?.name ?? c)),
    ...all<Parameters<typeof campaignToEvent>[0]>(
      `SELECT c.id, c.title, c.tagline, c.synopsis, c.release_date, c.motif, c.country, c.starts_on, c.ends_on, c.color1, c.color2, c.featured, c.markets, o.name org_name
       FROM campaigns c JOIN orgs o ON o.id = c.org_id WHERE c.status = 'scheduled' AND c.starts_on IS NOT NULL AND c.ends_on IS NOT NULL`,
    ).map(campaignToEvent),
  ]);
  return items;
}
