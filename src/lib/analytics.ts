import "server-only";
import { all, one, run } from "./db";
import { ctr, dailyHash, type Metric } from "./analytics-core";
import { addDays, today } from "./events";
import { webhookSecret } from "./cinema";

const SECRET = () => process.env.ANALYTICS_SALT || `analytics:${webhookSecret()}`;

const bump = (eventId: string, day: string, metric: string, country: string) =>
  run(
    `INSERT INTO analytics_daily (event_id, day, metric, country, count) VALUES (?,?,?,?,1)
     ON CONFLICT(event_id, day, metric, country) DO UPDATE SET count = count + 1`,
    eventId, day, metric, country,
  );

let prunedOn = "";

export function record(eventId: string, metric: Metric, country: string | null, identity: string) {
  const day = today();
  const c = country ?? "??";
  bump(eventId, day, metric, c);
  if (metric !== "impression") return;
  // A viewer's first impression of the day adds one to the aggregate "viewer" counter.
  const fresh = run("INSERT OR IGNORE INTO analytics_uniques (event_id, day, metric, hash) VALUES (?,?,?,?)", eventId, day, metric, dailyHash(SECRET(), day, identity));
  if (Number(fresh.changes) > 0) bump(eventId, day, "viewer", c);
  if (prunedOn !== day) {
    prunedOn = day;
    pruneUniques();
  }
}

/** Hashes are only needed to de-duplicate within a day; counts live in analytics_daily. */
export function pruneUniques(keepDays = 2) {
  run("DELETE FROM analytics_uniques WHERE day < ?", addDays(today(), -keepDays));
}

export type EventStats = {
  impressions: number; viewerDays: number; clicks: number; views: number; ctr: number;
  byCountry: { country: string; impressions: number; clicks: number; claims: number }[];
  daily: { day: string; impressions: number; clicks: number; claims: number }[];
};

export function eventStats(eventId: string, from?: string | null, to?: string | null): EventStats {
  const start = from ?? addDays(today(), -29);
  const end = to && to < today() ? to : today();
  const sum = (metric: Metric | "viewer") => one<{ n: number }>("SELECT COALESCE(SUM(count),0) n FROM analytics_daily WHERE event_id = ? AND metric = ? AND day BETWEEN ? AND ?", eventId, metric, start, end)?.n ?? 0;
  const impressions = sum("impression");
  const clicks = sum("click");
  const viewerDays = sum("viewer");

  const byC = new Map<string, { impressions: number; clicks: number; claims: number }>();
  for (const r of all<{ country: string; metric: string; n: number }>(
    "SELECT country, metric, SUM(count) n FROM analytics_daily WHERE event_id = ? AND day BETWEEN ? AND ? GROUP BY country, metric", eventId, start, end,
  )) {
    const row = byC.get(r.country) ?? { impressions: 0, clicks: 0, claims: 0 };
    if (r.metric === "impression") row.impressions = r.n;
    if (r.metric === "click") row.clicks = r.n;
    byC.set(r.country, row);
  }
  for (const r of all<{ country: string; n: number }>(
    "SELECT u.home_country country, COUNT(*) n FROM event_claims c JOIN users u ON u.id = c.user_id WHERE c.event_id = ? GROUP BY u.home_country", eventId,
  )) {
    const row = byC.get(r.country) ?? { impressions: 0, clicks: 0, claims: 0 };
    row.claims = r.n;
    byC.set(r.country, row);
  }

  const days: string[] = [];
  for (let d = start; d <= end && days.length < 62; d = addDays(d, 1)) days.push(d);
  const perDay = new Map(days.map((d) => [d, { day: d, impressions: 0, clicks: 0, claims: 0 }]));
  for (const r of all<{ day: string; metric: string; n: number }>(
    "SELECT day, metric, SUM(count) n FROM analytics_daily WHERE event_id = ? AND day BETWEEN ? AND ? GROUP BY day, metric", eventId, start, end,
  )) {
    const p = perDay.get(r.day);
    if (p && r.metric === "impression") p.impressions = r.n;
    if (p && r.metric === "click") p.clicks = r.n;
  }
  for (const r of all<{ day: string; n: number }>("SELECT substr(created_at, 1, 10) day, COUNT(*) n FROM event_claims WHERE event_id = ? GROUP BY day", eventId)) {
    const p = perDay.get(r.day);
    if (p) p.claims = r.n;
  }
  return {
    impressions, viewerDays, clicks, views: sum("view"), ctr: ctr(clicks, impressions),
    byCountry: [...byC.entries()].map(([country, v]) => ({ country, ...v })).sort((a, b) => b.impressions - a.impressions),
    daily: [...perDay.values()],
  };
}
