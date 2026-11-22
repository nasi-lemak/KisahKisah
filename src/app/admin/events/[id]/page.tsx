import Link from "next/link";
import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { GENRES } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/regions";
import type { HouseEventRow } from "@/lib/workflow";
import { HouseEventForm } from "@/components/admin/HouseEventForm";
import { AnalyticsPanel } from "@/components/AnalyticsPanel";

export default async function EditEvent({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const r = one<HouseEventRow>("SELECT * FROM house_events WHERE id = ?", (await params).id);
  if (!r) notFound();
  const { saved } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold">{r.icon} {r.name}</h1>
        {saved && <span className="chip border-jade text-jade">✓ Saved</span>}
        <Link href={`/events/${r.id}`} className="ml-auto text-sm text-saffron">Public page →</Link>
      </div>
      <HouseEventForm key={`${r.id}-${r.starts}-${r.ends}-${r.enabled}`} initial={r} genres={[...GENRES]} countries={COUNTRIES.map((c) => ({ code: c.code, name: c.name, flag: c.flag }))} />
      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Performance (last 30 days)</h2>
        <AnalyticsPanel eventId={r.id} />
      </section>
    </div>
  );
}
