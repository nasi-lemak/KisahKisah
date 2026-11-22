import type { ActiveEvent } from "@/lib/events";
import { TrackedLink, TrackOnView } from "./Track";

/** Thin strip under the header while an event or campaign is live. */
export function EventBanner({ events }: { events: ActiveEvent[] }) {
  if (!events.length) return null;
  return (
    <div className="border-b border-line">
      {events.slice(0, 2).map((e) => (
        <TrackedLink
          key={e.id}
          eventId={e.id}
          href={`/events/${e.id}`}
          className="block px-4 py-2 text-sm hover:brightness-110"
          style={{ background: `linear-gradient(90deg, ${e.colors[0]}33, ${e.colors[1]}22)` }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <span className="text-lg">{e.icon}</span>
            <span className="min-w-0 truncate">
              <b>{e.name}</b>
              {e.kind === "sponsored" && <span className="ml-2 rounded bg-white/15 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider">Sponsored</span>}
              <span className="ml-2 text-muted">{e.tagline}</span>
            </span>
            <span className="ml-auto shrink-0 text-xs text-muted">{e.daysLeft === 0 ? "last day!" : `${e.daysLeft}d left`} →</span>
          </div>
          <TrackOnView eventId={e.id} metric="impression" />
        </TrackedLink>
      ))}
    </div>
  );
}

export function EventCard({ e, note }: { e: { id: string; name: string; icon: string; tagline: string; kind: string; colors: [string, string]; markets?: string[] }; note: string }) {
  return (
    <TrackedLink eventId={e.id} href={`/events/${e.id}`} className="card group overflow-hidden transition hover:border-saffron/60">
      <div className="flex h-20 items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${e.colors[0]}, ${e.colors[1]})` }}>
        <span className="drop-shadow-lg transition group-hover:scale-125">{e.icon}</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 font-bold">
          {e.name}
          {e.kind === "sponsored" && <span className="rounded bg-raised px-1.5 text-[0.6rem] uppercase tracking-wider text-muted">Sponsored</span>}
          {e.markets?.length && !e.markets.includes("GLOBAL") ? <span className="rounded bg-raised px-1.5 text-[0.6rem] text-muted" title="Only shown in these countries">🎯 {e.markets.join(" ")}</span> : null}
        </div>
        <div className="line-clamp-1 text-xs text-muted">{e.tagline}</div>
        <div className="mt-1 text-xs font-semibold text-saffron">{note}</div>
      </div>
      {e.kind === "sponsored" && <TrackOnView eventId={e.id} metric="impression" />}
    </TrackedLink>
  );
}
