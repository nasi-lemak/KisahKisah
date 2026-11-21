import Link from "next/link";
import type { Metadata } from "next";
import { activeEvents, allEvents, nextOccurrence, occurrenceIn, parsePreviewDate, today, upcomingEvents } from "@/lib/events";
import { EventCard } from "@/components/EventBanner";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Events & limited drops" };

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const sp = await searchParams;
  const preview = parsePreviewDate(sp.preview);
  const date = preview ?? today();
  const live = activeEvents(date);
  const upcoming = upcomingEvents(date, 6);
  const year = Number(date.slice(0, 4));
  const calendar = allEvents()
    .map((e) => ({ e, o: occurrenceIn(e, year) ?? nextOccurrence(e, `${year}-01-01`) }))
    .filter((x) => x.o && x.e.kind === "house")
    .sort((a, b) => a.o!.start.localeCompare(b.o!.start));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Events & limited drops 🎪</h1>
          <p className="max-w-2xl text-muted">
            Festivals from across Southeast Asia and fan holidays from around the world. Each one brings free stickers, themes you can only get that week, and bonus KP for logging the right titles.
          </p>
        </div>
        <form className="card flex items-end gap-2 p-3" action="/events">
          <div>
            <label className="label" htmlFor="preview">Time machine ⏳</label>
            <input id="preview" type="date" name="preview" defaultValue={preview ?? ""} className="input py-1.5" />
          </div>
          <button className="btn btn-ghost py-1.5">Preview</button>
          {preview && <Link href="/events" className="pb-2 text-xs text-muted hover:text-text">reset</Link>}
        </form>
      </div>
      {preview && (
        <p className="rounded-lg border border-saffron/40 bg-saffron/10 px-4 py-2 text-sm">
          Previewing <b>{fmt(preview)} {preview.slice(0, 4)}</b>. Claims only work while an event is actually live.
        </p>
      )}

      <section>
        <h2 className="section-title">Live {preview ? "on that day" : "now"}</h2>
        {live.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {live.map((e) => (
              <EventCard key={e.id} e={e} note={e.daysLeft === 0 ? "Last day!" : `${e.daysLeft} day${e.daysLeft > 1 ? "s" : ""} left`} />
            ))}
          </div>
        ) : (
          <Empty>Nothing live right now. Try the time machine with 2026-05-04 or 2026-10-31.</Empty>
        )}
      </section>

      <section>
        <h2 className="section-title">Coming up</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <EventCard key={e.id} e={e} note={`${fmt(e.occurrence.start)}${e.approximate ? " (approx.)" : ""} · in ${e.daysUntil} days`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{year} calendar</h2>
        <div className="card divide-y divide-line">
          {calendar.map(({ e, o }) => (
            <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-raised">
              <span className="w-28 shrink-0 font-mono text-xs text-muted">
                {fmt(o!.start)}
                {o!.end !== o!.start ? `–${fmt(o!.end)}` : ""}
              </span>
              <span className="text-lg">{e.icon}</span>
              <span className="font-semibold">{e.name}</span>
              <span className="hidden truncate text-muted sm:inline">{e.tagline}</span>
              {e.approximate && <span className="ml-auto shrink-0 text-[0.65rem] text-muted">date approx.</span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="font-display text-xl font-bold">Have a film coming out?</div>
          <p className="text-sm text-muted">Studios and distributors can run sponsored campaigns: themes, sticker packs and launch-week events.</p>
        </div>
        <Link href="/advertise" className="btn btn-primary">Advertise with us →</Link>
      </section>
    </div>
  );
}
