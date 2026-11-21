import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { briefById, briefItems } from "@/lib/portal";
import { formatFee } from "@/lib/workflow";
import { SPECS, type UploadType } from "@/lib/asset-spec";
import { toShopItem } from "@/lib/custom-items";
import { startBriefItem } from "@/app/artists/actions";
import { ItemPreview } from "@/components/ItemPreview";

const ITEM_STATUS: Record<string, string> = { draft: "Draft", submitted: "In review", approved: "Approved ✓", live: "Live ✓", retired: "Retired" };

export default async function BriefWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const b = briefById(Number((await params).id));
  if (!b || b.assigned_to !== user.id) notFound();
  const items = briefItems(b.id);
  const spec = (SPECS as Record<string, (typeof SPECS)[UploadType]>)[b.item_type];
  const payout = one<{ status: string; paid_at: string | null }>("SELECT status, paid_at FROM payouts WHERE brief_id = ?", b.id);
  return (
    <div className="space-y-6">
      <Link href="/artists" className="text-sm text-muted hover:text-text">← Artist programme</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{b.title}</h1>
          <div className="text-sm text-muted">{b.quantity} × {b.item_type}{b.due_on ? ` · due ${b.due_on}` : ""}</div>
        </div>
        <div className="glass px-4 py-2 text-right">
          <div className="font-mono text-xl font-bold text-jade">{formatFee(b.fee_amount, b.fee_currency)}</div>
          <div className="text-xs text-muted">{payout ? (payout.status === "paid" ? `Paid ${payout.paid_at?.slice(0, 10)}` : "Accepted · payment pending") : b.status === "in_review" ? "In review" : "In progress"}</div>
        </div>
      </div>
      <section className="glass space-y-2 p-5 text-sm">
        <h2 className="font-display text-lg font-bold">The brief</h2>
        <p className="whitespace-pre-line">{b.description || "No extra notes."}</p>
        {spec && <p className="text-muted">Spec: {spec.recommended}, {spec.formats.join("/").toUpperCase()}, max {Math.round(spec.maxBytes / 1000)} KB{spec.alpha === "required" ? ", transparent background" : ""}. <Link href="/specs" className="text-saffron">Full spec ↗</Link></p>}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">Your pieces ({items.length}/{b.quantity})</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((i) => (
            <Link key={i.id} href={`/contribute/items/${i.id}`} className="glass flex flex-col items-center gap-2 p-3 text-center text-sm hover:ring-1 hover:ring-saffron/50">
              <div className="flex h-20 w-full items-center justify-center overflow-hidden"><ItemPreview item={toShopItem(i)} compact /></div>
              <div className="font-semibold">{i.name}</div>
              <span className="text-xs text-muted">{ITEM_STATUS[i.status]}</span>
            </Link>
          ))}
          {items.length < b.quantity && b.status !== "done" && (
            <form action={startBriefItem.bind(null, b.id)} className="glass flex flex-col items-center justify-center gap-2 p-3">
              <span className="text-3xl opacity-50">＋</span>
              <button className="btn btn-primary py-1 text-sm">Start piece {items.length + 1}</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
