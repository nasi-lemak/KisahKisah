import Link from "next/link";
import type { Metadata } from "next";
import { activeEvents, allEvents, isApproximate, nextOccurrence, occurrenceIn, parsePreviewDate, today, upcomingEvents, visibleTo } from "@/lib/events";
import { EventCard } from "@/components/EventBanner";
import { audience } from "@/lib/geo";
import { getI18n } from "@/lib/i18n/server";
import { Empty } from "@/components/ui";

export const metadata: Metadata = { title: "Events & limited drops" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const sp = await searchParams;
  const preview = parsePreviewDate(sp.preview);
  const date = preview ?? today();
  const who = await audience();
  const { t, date: fmtDate } = await getI18n();
  const fmt = (d: string) => fmtDate(d, "short");
  const live = activeEvents(date, who);
  const upcoming = upcomingEvents(date, 6, who);
  const year = Number(date.slice(0, 4));
  const calendar = allEvents()
    .map((e) => ({ e, o: occurrenceIn(e, year) ?? nextOccurrence(e, `${year}-01-01`) }))
    .filter((x) => x.o && x.e.kind === "house" && visibleTo(x.e, who))
    .sort((a, b) => a.o!.start.localeCompare(b.o!.start));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">{t("events.title")}</h1>
          <p className="max-w-2xl text-muted">{t("events.intro")}</p>
        </div>
        <form className="card flex items-end gap-2 p-3" action="/events">
          <div>
            <label className="label" htmlFor="preview">{t("events.timeMachine")}</label>
            <input id="preview" type="date" name="preview" defaultValue={preview ?? ""} className="input py-1.5" />
          </div>
          <button className="btn btn-ghost py-1.5">{t("events.preview")}</button>
          {preview && <Link href="/events" className="pb-2 text-xs text-muted hover:text-text">{t("events.reset")}</Link>}
        </form>
      </div>
      {preview && (
        <p className="rounded-lg border border-saffron/40 bg-saffron/10 px-4 py-2 text-sm">
          {t("events.previewing", { date: fmtDate(preview) })}
        </p>
      )}

      <section>
        <h2 className="section-title">{preview ? t("events.liveThatDay") : t("events.liveNow")}</h2>
        {live.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {live.map((e) => (
              <EventCard key={e.id} e={e} note={e.daysLeft === 0 ? t("events.lastDay") : e.daysLeft === 1 ? t("events.daysLeftOne") : t("events.daysLeftMany", { n: e.daysLeft })} />
            ))}
          </div>
        ) : (
          <Empty>{t("events.nothingLive")}</Empty>
        )}
      </section>

      <section>
        <h2 className="section-title">{t("events.comingUp")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((e) => (
            <EventCard key={e.id} e={e} note={`${fmt(e.occurrence.start)}${isApproximate(e, Number(e.occurrence.start.slice(0, 4))) ? ` ${t("events.approx")}` : ""} · ${t("events.inDays", { n: e.daysUntil })}`} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">{t("events.calendar", { year })}</h2>
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
              {isApproximate(e, Number(o!.start.slice(0, 4))) && <span className="ml-auto shrink-0 text-[0.65rem] text-muted">{t("events.approxShort")}</span>}
            </Link>
          ))}
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="font-display text-xl font-bold">{t("events.haveFilm")}</div>
          <p className="text-sm text-muted">{t("events.haveFilmBody")}</p>
        </div>
        <Link href="/advertise" className="btn btn-primary">{t("events.advertise")}</Link>
      </section>
    </div>
  );
}
