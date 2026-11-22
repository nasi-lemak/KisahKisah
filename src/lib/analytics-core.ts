/** Pure analytics helpers (no DB), unit-tested. */
import { createHash } from "node:crypto";

export const METRICS = ["impression", "click", "view"] as const;
export type Metric = (typeof METRICS)[number];

const BOTS = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|embedly|preview|curl|wget|python-requests|httpclient|monitor/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOTS.test(userAgent);
}

/** Respect Do Not Track and Global Privacy Control: don't count these visitors at all. */
export function optedOut(dnt: string | null, gpc: string | null): boolean {
  return dnt === "1" || gpc === "1";
}

/**
 * A per-day pseudonym for counting unique viewers. The salt changes every day,
 * so the same person gets an unrelated hash tomorrow and can't be tracked across days.
 */
export function dailyHash(secret: string, day: string, identity: string): string {
  return createHash("sha256").update(`${secret}:${day}:${identity}`).digest("hex").slice(0, 32);
}

export function ctr(clicks: number, impressions: number): number {
  return impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0;
}
