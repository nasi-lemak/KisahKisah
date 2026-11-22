import Link from "next/link";
import { all } from "@/lib/db";
import { occurrenceIn } from "@/lib/events";
import { allEvents, activeOccurrence, nextOccurrence, today } from "@/lib/events";
import type { HouseEventRow } from "@/lib/workflow";
import { ConfirmDateForm } from "@/components/admin/HouseEventForm";

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function AdminEvents() {
  const rows = all<HouseEventRow>("SELECT * FROM house_events ORDER BY updated_at DESC");
  const dbIds = new Set(rows.map((r) => r.id));
  const thisYear = new Date().getUTCFullYear();
  const confirmed = new Map(all<{ event_id: string; year: number; start: string; days: number; note: string }>("SELECT event_id, year, start, days, note FROM event_dates").map((r) => [`${r.event_id}:${r.year}`, r]));
  const builtIn = allEvents().filter((e) => !dbIds.has(e.id) && !e.id.startsWith("cmp-"));
  const when = (id: string) => {
    const e = allEvents().find((x) => x.id === id);
    if (!e) return "paused";
    const now = activeOccurrence(e, today());
    const next = nextOccurrence(e, today());
    return now ? `🟢 live until ${fmt(now.end)}` : next ? `next ${fmt(next.start)}` : "no upcoming dates";
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-extrabold">Events calendar</h1>
        <Link href="/admin/events/new" className="btn btn-primary ml-auto">＋ New event</Link>
      </div>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Made in the admin</h2>
        {rows.length === 0 && <div className="glass p-6 text-sm text-muted">None yet. Create seasonal events here: no code or deploy needed.</div>}
        {rows.map((r) => (
          <Link key={r.id} href={`/admin/events/${r.id}`} className="glass flex flex-wrap items-center gap-3 p-4 hover:ring-1 hover:ring-saffron/50">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg text-xl" style={{ background: `linear-gradient(135deg, ${r.color1}, ${r.color2})` }}>{r.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold">{r.name} {!r.enabled && <span className="chip py-0 text-xs">paused</span>}</div>
              <div className="text-xs text-muted">{r.repeat === "yearly" ? `every year ${r.starts} → ${r.ends}` : `${r.starts} → ${r.ends}`}{r.markets ? ` · 🎯 ${r.markets.replace(/,/g, " ")}` : ""}</div>
            </div>
            <span className="text-xs text-muted">{r.enabled ? when(r.id) : "paused"}</span>
          </Link>
        ))}
      </section>
      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Moving festivals: confirm each year&apos;s dates</h2>
        <p className="text-xs text-muted">Lunar and Islamic festivals move every year and can differ by country. The code has estimates; confirm the real dates once announced (for example by JAKIM or MUIS). Confirmed dates replace the estimates everywhere, and you can add years the code doesn&apos;t know yet.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-muted"><th className="py-1">Festival</th><th>Year</th><th>Status</th><th>Set the dates</th></tr></thead>
          <tbody>
            {allEvents().filter((e) => e.rule.kind === "dated").flatMap((e) => [thisYear, thisYear + 1].map((y) => {
              const o = occurrenceIn(e, y);
              const c = confirmed.get(`${e.id}:${y}`);
              return (
                <tr key={`${e.id}-${y}`} className="border-t border-line align-middle">
                  <td className="py-2">{e.icon} {e.name}</td>
                  <td>{y}</td>
                  <td className="text-xs">{c ? <span className="text-jade">✓ confirmed {c.start}{c.note ? ` · ${c.note}` : ""}</span> : o ? <span className="text-saffron">estimate {o.start}</span> : <span className="text-red-300">no date</span>}</td>
                  <td><ConfirmDateForm eventId={e.id} year={y} start={o?.start ?? `${y}-01-01`} days={e.rule.kind === "dated" ? (c?.days ?? e.rule.days) : 1} /></td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Built in</h2>
        <p className="text-xs text-muted">These ship with the code. Create an admin event to run something new alongside them.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {builtIn.map((e) => (
            <div key={e.id} className="glass flex items-center gap-3 p-3 text-sm">
              <span className="text-xl">{e.icon}</span>
              <span className="flex-1 font-semibold">{e.name}{e.kind === "sponsored" ? " · sponsored" : ""}</span>
              <span className="text-xs text-muted">{when(e.id)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
