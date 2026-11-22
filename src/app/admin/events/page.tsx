import Link from "next/link";
import { all } from "@/lib/db";
import { allEvents, activeOccurrence, nextOccurrence, today } from "@/lib/events";
import type { HouseEventRow } from "@/lib/workflow";

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default function AdminEvents() {
  const rows = all<HouseEventRow>("SELECT * FROM house_events ORDER BY updated_at DESC");
  const dbIds = new Set(rows.map((r) => r.id));
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
