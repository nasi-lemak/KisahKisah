import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { inventory } from "@/lib/queries";
import { ITEM_BY_ID } from "@/lib/shop";
import { AvatarGlyph } from "@/components/ui";
import { equipItem } from "@/app/actions";
import { ItemPreview, RarityTag } from "@/components/ItemPreview";
import { Avatar } from "@/components/ui";

export const metadata = { title: "Inventory" };

type Slot = "avatar" | "frame" | "banner" | "title" | "theme";
const SLOTS: { type: Slot; title: string; col: "avatar_item" | "frame_item" | "banner_item" | "title_item" | "theme_item" }[] = [
  { type: "avatar", title: "Avatars", col: "avatar_item" },
  { type: "frame", title: "Frames", col: "frame_item" },
  { type: "banner", title: "Banners", col: "banner_item" },
  { type: "title", title: "Titles", col: "title_item" },
  { type: "theme", title: "Site theme", col: "theme_item" },
];

export default async function InventoryPage() {
  const user = await requireUser("/kedai/inventory");
  const owned = inventory(user.id).map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const banner = user.banner_item ? ITEM_BY_ID[user.banner_item]?.value : "";
  const title = user.title_item ? ITEM_BY_ID[user.title_item]?.value : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Inventory & equip</h1>
        <Link href="/kedai" className="btn btn-ghost">← Back to Kedai</Link>
      </div>

      <div className="card overflow-hidden">
        <div className={`banner h-28 ${banner}`} />
        <div className="-mt-10 flex items-end gap-4 px-6 pb-5">
          <Avatar item={user.avatar_item} frame={user.frame_item} size={84} />
          <div className="pb-1">
            <div className="font-display text-2xl font-bold">{user.display_name}</div>
            {title && <span className="chip border-lotus/50 py-0 text-sm italic text-lotus">{title}</span>}
          </div>
          <Link href={`/u/${user.username}`} className="ml-auto pb-1 text-sm text-muted hover:text-text">View profile →</Link>
        </div>
      </div>

      <section>
        <h2 className="section-title">Stickers · use them on any review page</h2>
        <div className="flex flex-wrap gap-2">
          {owned.filter((i) => i.type === "sticker").map((i) => (
            <span key={i.id} className="card flex items-center gap-2 px-3 py-1.5 text-sm" title={i.description}>
              <AvatarGlyph value={i.value} px={34} /> {i.name}
            </span>
          ))}
        </div>
      </section>

      {SLOTS.map((slot) => {
        const items = owned.filter((i) => i.type === slot.type);
        const equipped = user[slot.col];
        return (
          <section key={slot.type}>
            <h2 className="section-title">{slot.title}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted">None yet. <Link href="/kedai" className="text-saffron">Visit the Kedai</Link>.</p>
            ) : (
              <div className={`grid gap-3 ${slot.type === "banner" || slot.type === "theme" ? "sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6"}`}>
                {slot.type !== "avatar" && (
                  <form action={equipItem.bind(null, null, slot.type)} className={`card flex flex-col items-center justify-center gap-2 p-4 ${!equipped ? "border-saffron" : ""}`}>
                    <div className="text-sm text-muted">None</div>
                    <button className="btn btn-ghost py-1 text-xs" disabled={!equipped}>{equipped ? "Unequip" : "Equipped"}</button>
                  </form>
                )}
                {items.map((item) => {
                  const on = equipped === item.id;
                  return (
                    <form key={item.id} action={equipItem.bind(null, item.id, slot.type)} className={`card flex flex-col items-center gap-2 p-4 text-center ${on ? "border-saffron bg-saffron/5" : ""}`}>
                      <div className="flex h-20 w-full items-center justify-center">
                        <ItemPreview item={item} avatar={user.avatar_item} />
                      </div>
                      <RarityTag item={item} />
                      <div className="text-sm font-semibold">{item.name}</div>
                      <button className={`btn py-1 text-xs ${on ? "btn-primary" : "btn-ghost"}`} disabled={on}>{on ? "Equipped" : "Equip"}</button>
                    </form>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
