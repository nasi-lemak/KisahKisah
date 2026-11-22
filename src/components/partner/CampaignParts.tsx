import Link from "next/link";
import { CHAIN_BY_ID } from "@/lib/cinema";
import { country } from "@/lib/regions";
import type { Campaign } from "@/lib/portal";
import { campaignReport } from "@/lib/portal";
import { campaignEventId, slotsFor } from "@/lib/workflow";
import { AnalyticsPanel } from "../AnalyticsPanel";
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {([
          ["🔔 Notify-me sign-ups", r.reminders.signups],
          ["Reminders sent", r.reminders.sent],
          ["🎟️ Bonus tickets", r.tickets.n],
          ["Bonus KP paid", r.tickets.points],
          ["Ticket items given", r.tickets.items],
        ] as [string, number][]).map(([l, v]) => (
          <div key={l} className="rounded-xl bg-black/20 p-3 text-center">
            <div className="font-display text-2xl font-extrabold">{v.toLocaleString()}</div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>
      {(r.byChain.length > 0 || r.reminders.byCountry.length > 0) && (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {r.byChain.length > 0 && (
            <table className="w-full">
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted"><th className="py-1">Cinema</th><th>Tickets</th><th>Bonus KP</th></tr></thead>
              <tbody>{r.byChain.map((x) => <tr key={x.chain_id} className="border-t border-line"><td className="py-1.5">{CHAIN_BY_ID[x.chain_id]?.name ?? x.chain_id}</td><td>{x.n}</td><td>{x.points}</td></tr>)}</tbody>
            </table>
          )}
          {r.reminders.byCountry.length > 0 && (
            <table className="w-full">
              <thead><tr className="text-left text-xs uppercase tracking-widest text-muted"><th className="py-1">Waiting for release</th><th>Fans</th></tr></thead>
              <tbody>{r.reminders.byCountry.map((x) => <tr key={x.country} className="border-t border-line"><td className="py-1.5">{country(x.country)?.flag} {country(x.country)?.name ?? x.country}</td><td>{x.n}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      )}
      <AnalyticsPanel eventId={campaignEventId(c.id)} from={c.starts_on} to={c.ends_on} />
    </div>
  );
}
