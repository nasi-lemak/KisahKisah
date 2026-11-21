import Link from "next/link";
import type { Campaign } from "@/lib/portal";
import { campaignReport } from "@/lib/portal";
import { slotsFor } from "@/lib/workflow";
import { toShopItem, type CustomItemRow } from "@/lib/custom-items";
import { ItemPreview } from "../ItemPreview";
import { today } from "@/lib/events";

const ITEM_STATUS: Record<string, string> = { draft: "Draft", submitted: "In review", approved: "Approved", live: "Live", retired: "Ended" };
const ITEM_STYLE: Record<string, string> = { draft: "bg-raised text-muted", submitted: "bg-saffron/20 text-saffron", approved: "bg-sky-500/20 text-sky-300", live: "bg-jade/20 text-jade", retired: "bg-raised text-muted" };

export function campaignPhase(c: Campaign): { step: number; label: string } {
  if (c.status === "scheduled") {
    const t = today();
    if (c.ends_on && t > c.ends_on) return { step: 4, label: "Ended" };
    if (c.starts_on && t >= c.starts_on) return { step: 4, label: "Live now" };
    return { step: 3, label: "Scheduled" };
  }
  if (c.status === "submitted") return { step: 2, label: "In review" };
  return { step: 1, label: "Brief" };
}

export function Stepper({ c }: { c: Campaign }) {
  const { step, label } = campaignPhase(c);
  const steps = ["Brief & uploads", "Submitted for review", "Scheduled", label === "Ended" ? "Ended" : "Live"];
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s} className={`rounded-xl p-3 text-sm ${i + 1 < step ? "bg-jade/15 text-jade" : i + 1 === step ? "bg-saffron/15 ring-1 ring-saffron" : "bg-black/20 text-muted"}`}>
          <div className="text-xs font-bold">Step {i + 1}</div>
          <div className="font-semibold">{i + 1 < step ? "✓ " : ""}{s}</div>
        </li>
      ))}
    </ol>
  );
}

/** Upload slots from the package; `href` decides where an item opens (partner vs admin). */
export function SlotGrid({ c, items, href, start }: { c: Campaign; items: CustomItemRow[]; href: (id: string) => string; start?: (slot: number) => React.ReactNode }) {
  const slots = slotsFor(c.package);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {slots.map((s, i) => {
        const item = items.find((x) => x.slot === String(i));
        return (
          <div key={i} className="glass flex flex-col items-center gap-2 p-3 text-center text-sm">
            <div className="text-xs font-bold uppercase tracking-widest text-muted">{s.label}</div>
            {item ? (
              <>
                <div className="flex h-20 w-full items-center justify-center overflow-hidden">
                  <ItemPreview item={toShopItem(item)} compact />
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest ${ITEM_STYLE[item.status]}`}>{ITEM_STATUS[item.status]}</span>
                <Link href={href(item.id)} className="btn btn-ghost w-full justify-center py-1 text-xs">Open</Link>
              </>
            ) : (
              <>
                <div className="flex h-20 items-center text-3xl opacity-40">＋</div>
                {start ? start(i) : <span className="text-xs text-muted">Not started</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CampaignReport({ c }: { c: Campaign }) {
  const r = campaignReport(c);
  const tiles: [string, string | number][] = [["Fans who claimed", r.uniqueClaimers], ["Items claimed", r.totalClaims], ["Equipped right now", r.equippedNow], ["KP spent", r.kpSpent]];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-black/20 p-3 text-center">
            <div className="font-display text-3xl font-extrabold">{v}</div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>
      {r.perItem.length > 0 && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-muted"><th className="py-1">Item</th><th>Claims</th><th>Owners</th><th>Equipped</th><th>Sticker uses</th></tr></thead>
          <tbody>
            {r.perItem.map((i) => (
              <tr key={i.id} className="border-t border-line"><td className="py-1.5">{i.name}</td><td>{i.claims}</td><td>{i.owners}</td><td>{i.equipped}</td><td>{i.type === "sticker" ? i.stickerUses : "–"}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-muted">Banner impressions and page views need analytics that aren't connected yet.</p>
    </div>
  );
}
