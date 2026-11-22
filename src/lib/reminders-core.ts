/** Pure helpers for "Notify me" reminders. */

export type Target = { kind: "film" | "cmp"; id: number };

export function parseTarget(raw: string): Target | null {
  const m = /^(film|cmp):(\d{1,9})$/.exec(raw);
  return m ? { kind: m[1] as Target["kind"], id: Number(m[2]) } : null;
}

export const targetKey = (t: Target) => `${t.kind}:${t.id}`;

/** Sign-ups are open while the release is still ahead. */
export function canSignUp(releaseDate: string | null | undefined, today: string): boolean {
  return !!releaseDate && releaseDate > today;
}

/** Due once the release date has arrived; reminders more than 14 days late are dropped as stale. */
export function reminderDue(releaseDate: string | null | undefined, today: string): "due" | "wait" | "stale" {
  if (!releaseDate) return "wait";
  if (releaseDate > today) return "wait";
  const late = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${releaseDate}T00:00:00Z`)) / 86400_000;
  return late > 14 ? "stale" : "due";
}

/** Bonus KP for a partner-cinema ticket during a campaign: a percentage of the ticket's points, capped. */
export function ticketBonus(basePoints: number, pct: number, cap = 500): number {
  if (!(pct > 0) || !(basePoints > 0)) return 0;
  return Math.min(cap, Math.max(1, Math.round((basePoints * Math.min(pct, 300)) / 100)));
}

export function inMarkets(markets: string | null | undefined, homeCountry: string | null | undefined): boolean {
  const list = (markets ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  if (!list.length || list.includes("GLOBAL")) return true;
  return !!homeCountry && list.includes(homeCountry);
}
