"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { readiness, type CustomData, type Draft } from "@/lib/custom-item-map";
import { syncCustomItems, type CustomItemRow } from "@/lib/custom-items";
import { validateGradient, validateTheme } from "@/lib/asset-spec";
import { eventById } from "@/lib/events";
import type { ItemType, Rarity } from "@/lib/shop";

const TYPES: ItemType[] = ["avatar", "frame", "effect", "namestyle", "banner", "sticker", "theme", "title"];
const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];
const ANIMS = ["bounce", "wobble", "spin", "pulse", "float", "shake"];
const MOTIONS = ["fall", "rise", "drift", "streak", "twinkle"];

export type SaveInput = {
  id?: string; type: string; name: string; description: string; rarity: string; price: number | null;
  event: string | null; event_price: number | null; asset_key: string | null; artist: string; notes: string; data: CustomData;
};

function cleanData(type: ItemType, d: CustomData): CustomData {
  const hex = (x: unknown) => typeof x === "string" && /^#[0-9a-f]{6}$/i.test(x);
  switch (type) {
    case "sticker":
      return { anim: ANIMS.includes(d.anim ?? "") ? d.anim : undefined };
    case "effect":
      return {
        particles: (d.particles ?? []).map((p) => String(p).slice(0, 8)).filter(Boolean).slice(0, 4),
        motion: MOTIONS.includes(d.motion ?? "") ? d.motion : "fall",
      };
    case "theme":
      return { theme: Object.fromEntries(Object.entries(d.theme ?? {}).filter(([k, v]) => /^[a-z]+$/.test(k) && hex(v))) };
    case "namestyle":
      return { gradient: (d.gradient ?? []).filter(hex).slice(0, 4), shimmer: !!d.shimmer };
    case "title":
      return { text: String(d.text ?? "").slice(0, 40) };
    default:
      return {};
  }
}

function colourOk(type: ItemType, d: CustomData) {
  if (type === "theme") return validateTheme(d.theme ?? {}).ok;
  if (type === "namestyle") return validateGradient(d.gradient ?? []).ok;
  return true;
}

function assetOk(key: string | null): boolean {
  if (!key) return false;
  const a = one<{ checks: string }>("SELECT checks FROM assets WHERE key = ?", key);
  try {
    return !!a && JSON.parse(a.checks).ok === true;
  } catch {
    return false;
  }
}

export async function saveCustomItem(input: SaveInput): Promise<{ id?: string; error?: string }> {
  const user = await requireStaff();
  const type = input.type as ItemType;
  if (!TYPES.includes(type)) return { error: "Pick an item type." };
  const rarity = RARITIES.includes(input.rarity as Rarity) ? input.rarity : "rare";
  if (!input.name.trim()) return { error: "Give the item a name." };
  if (input.event && !eventById(input.event)) return { error: "Unknown event." };
  if (input.asset_key && !one("SELECT 1 x FROM assets WHERE key = ?", input.asset_key)) return { error: "That upload wasn't found. Upload again." };
  const price = input.price !== null && Number.isFinite(input.price) && input.price > 0 ? Math.round(Math.min(input.price, 100_000)) : null;
  const eventPrice = input.event ? Math.max(0, Math.round(Math.min(input.event_price ?? 0, 100_000))) : null;
  const data = JSON.stringify(cleanData(type, input.data));
  const fields = [type, input.name.trim().slice(0, 60), input.description.trim().slice(0, 240), rarity, price, input.event || null, eventPrice, input.asset_key, data, input.artist.trim().slice(0, 80), input.notes.slice(0, 2000)];

  if (input.id) {
    const existing = one<{ status: string }>("SELECT status FROM custom_items WHERE id = ?", input.id);
    if (!existing) return { error: "Item not found." };
    // Editing a live item takes it back to review, so nothing unchecked reaches the shop.
    const status = existing.status === "live" || existing.status === "approved" ? "draft" : existing.status;
    run(
      "UPDATE custom_items SET type=?, name=?, description=?, rarity=?, price=?, event=?, event_price=?, asset_key=?, data=?, artist=?, notes=?, status=?, updated_at=datetime('now') WHERE id = ?",
      ...fields, status, input.id,
    );
    syncCustomItems();
    revalidatePath("/", "layout");
    return { id: input.id };
  }
  const id = `ci_${randomBytes(5).toString("hex")}`;
  run(
    "INSERT INTO custom_items (type, name, description, rarity, price, event, event_price, asset_key, data, artist, notes, id, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ...fields, id, user.id,
  );
  return { id };
}

export async function setItemStatus(id: string, status: "draft" | "approved" | "live" | "retired"): Promise<{ ok?: boolean; error?: string }> {
  await requireStaff();
  const r = one<CustomItemRow>("SELECT * FROM custom_items WHERE id = ?", id);
  if (!r) return { error: "Item not found." };
  if (status === "approved" || status === "live") {
    const data = JSON.parse(r.data) as CustomData;
    const d: Draft = { type: r.type, name: r.name, description: r.description, price: r.price, event: r.event, event_price: r.event_price, asset_key: r.asset_key, assetOk: assetOk(r.asset_key), data };
    const failing = readiness(d, colourOk(r.type, data)).filter((c) => !c.pass);
    if (failing.length) return { error: `Not ready: ${failing.map((f) => f.label.toLowerCase()).join("; ")}.` };
  }
  if (status === "live" && r.status !== "approved" && r.status !== "retired") return { error: "Approve it first (a second pair of eyes)." };
  run(
    `UPDATE custom_items SET status = ?, updated_at = datetime('now')${status === "live" ? ", published_at = COALESCE(published_at, datetime('now'))" : ""} WHERE id = ?`,
    status, id,
  );
  syncCustomItems();
  revalidatePath("/", "layout");
  return { ok: true };
}
