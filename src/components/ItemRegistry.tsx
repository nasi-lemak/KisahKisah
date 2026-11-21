"use client";

import { registerItems, type ShopItem } from "@/lib/shop";

/**
 * Teaches the browser's copy of the catalogue about items created in the
 * admin. Renders nothing; registers during render so everything after it
 * (header, page) can look the items up.
 */
export function ItemRegistry({ items }: { items: ShopItem[] }) {
  registerItems(items);
  return null;
}
