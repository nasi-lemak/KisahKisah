import { eventStats } from "@/lib/analytics";
import { country } from "@/lib/regions";

/** Impressions, clicks and claims for an event or campaign, by day and by country. */
export function AnalyticsPanel({ eventId, from, to }: { eventId: string; from?: string | null; to?: string | null }) {
  const s = eventStats(eventId, from, to);
  const max = Math.max(1, ...s.daily.map((d) => d.impressions));
  const maxClaims = Math.max(1, ...s.daily.map((d) => d.claims));
  const tiles: [string, string | number, string][] = [
    ["Impressions", s.impressions.toLocaleString(), "banner or card at least half on screen for 1 second"],
    ["Daily viewers", s.viewerDays.toLocaleString(), "unique viewers per day, added up"],
    ["Clicks", s.clicks.toLocaleString(), "banner and card clicks"],
    ["Click-through", `${s.ctr}%`, "clicks ÷ impressions"],
    ["Event page views", s.views.toLocaleString(), ""],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {tiles.map(([l, v, hint]) => (
          <div key={l} className="rounded-xl bg-black/20 p-3 text-center" title={hint}>
            <div className="font-display text-2xl font-extrabold">{v}</div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>

      <figure className="rounded-xl bg-black/20 p-3">
        <figcaption className="mb-2 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-saffron" /> Impressions</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-jade" /> Claims</span>
          <span className="ml-auto">{s.daily[0]?.day} → {s.daily.at(-1)?.day}</span>
        </figcaption>
        <div className="flex h-28 items-end gap-[2px]" role="img" aria-label="Daily impressions and claims">
          {s.daily.map((d) => (
            <div key={d.day} className="relative flex h-full max-w-10 flex-1 flex-col justify-end" title={`${d.day}: ${d.impressions} impressions, ${d.clicks} clicks, ${d.claims} claims`}>
              <div className="rounded-t-sm bg-saffron/80" style={{ height: `${(d.impressions / max) * 100}%`, minHeight: d.impressions ? 2 : 0 }} />
              {d.claims > 0 && <div className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-jade" style={{ bottom: `${(d.claims / maxClaims) * 90}%` }} />}
            </div>
          ))}
        </div>
      </figure>

      {s.byCountry.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-widest text-muted"><th className="py-1">Country</th><th>Impressions</th><th>Clicks</th><th>CTR</th><th>Claims</th></tr></thead>
            <tbody>
              {s.byCountry.map((r) => (
                <tr key={r.country} className="border-t border-line">
                  <td className="py-1.5">{r.country === "??" ? "Unknown" : `${country(r.country)?.flag ?? ""} ${country(r.country)?.name ?? r.country}`}</td>
                  <td>{r.impressions}</td><td>{r.clicks}</td><td>{r.impressions ? `${Math.round((r.clicks / r.impressions) * 1000) / 10}%` : "–"}</td><td>{r.claims}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted">Aggregated counts only: no cookies, no IPs or user IDs stored. Visitors with Do Not Track or Global Privacy Control turned on aren't counted.</p>
    </div>
  );
}
