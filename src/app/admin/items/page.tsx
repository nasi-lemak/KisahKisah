import Link from "next/link";
import { all } from "@/lib/db";
import { toShopItem, type CustomItemRow } from "@/lib/custom-items";
import { ItemPreview } from "@/components/ItemPreview";
import { RARITY_STYLE } from "@/lib/shop";

const STATUS = ["all", "draft", "approved", "live", "retired"] as const;
const STYLE: Record<string, string> = { draft: "bg-raised text-muted", approved: "bg-sky-500/20 text-sky-300", live: "bg-jade/20 text-jade", retired: "bg-chili/15 text-red-300" };

export default async function AdminItems({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "all" } = await searchParams;
  const filter = STATUS.includes(status as (typeof STATUS)[number]) ? status : "all";
  const rows = filter === "all"
    ? all<CustomItemRow>("SELECT * FROM custom_items ORDER BY updated_at DESC")
    : all<CustomItemRow>("SELECT * FROM custom_items WHERE status = ? ORDER BY updated_at DESC", filter);
  const owners = Object.fromEntries(all<{ item_id: string; n: number }>("SELECT item_id, COUNT(*) n FROM inventory WHERE item_id LIKE 'ci\\_%' ESCAPE '\\' GROUP BY item_id").map((r) => [r.item_id, r.n]));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-extrabold">Items</h1>
        <Link href="/admin/items/new" className="btn btn-primary ml-auto">＋ New item</Link>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STATUS.map((s) => (
          <Link key={s} href={s === "all" ? "/admin/items" : `/admin/items?status=${s}`} className={`chip capitalize ${filter === s ? "border-saffron text-saffron" : ""}`}>{s}</Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="glass p-8 text-center text-muted">No items here yet. <Link href="/admin/items/new" className="text-saffron">Create one →</Link></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const item = toShopItem(r);
            return (
              <Link key={r.id} href={`/admin/items/${r.id}`} className="glass flex items-center gap-3 p-3 transition hover:ring-1 hover:ring-saffron/50">
                <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden">
                  <ItemPreview item={item} compact />
                </div>
                <div className="min-w-0 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest ${STYLE[r.status]}`}>{r.status}</span>
                  <div className="mt-1 truncate font-bold">{r.name}</div>
                  <div className="text-xs text-muted">
                    <span style={{ color: RARITY_STYLE[r.rarity].color }}>{RARITY_STYLE[r.rarity].label}</span> {r.type} · {r.event ? `event: ${r.event}` : r.price ? `🪙 ${r.price}` : "no price"}
                  </div>
                  <div className="text-xs text-muted">{owners[r.id] ?? 0} owners{r.artist ? ` · 🎨 ${r.artist}` : ""}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
