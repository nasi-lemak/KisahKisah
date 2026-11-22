import { headers } from "next/headers";
import { currentUser } from "@/lib/auth";
import { eventById } from "@/lib/events";
import { viewerCountry } from "@/lib/geo";
import { record } from "@/lib/analytics";
import { syncCustomItems } from "@/lib/custom-items";
import { METRICS, isBot, optedOut, type Metric } from "@/lib/analytics-core";

/** Beacon endpoint for event impressions, clicks and page views. Always answers 204. */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 });
  const h = await headers();
  if (optedOut(h.get("dnt"), h.get("sec-gpc")) || isBot(h.get("user-agent"))) return done;
  const raw = await req.text();
  if (raw.length > 300) return done;
  let body: { e?: unknown; m?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return done;
  }
  const metric = METRICS.find((m) => m === body.m) as Metric | undefined;
  const id = typeof body.e === "string" ? body.e.slice(0, 80) : "";
  if (!metric || !id) return done;
  // Campaign and admin-made events live in the database: refresh this runtime's registry on a miss.
  if (!eventById(id)) {
    syncCustomItems();
    if (!eventById(id)) return done;
  }
  const user = await currentUser();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "?";
  const identity = user ? `u:${user.id}` : `a:${ip}:${h.get("user-agent")}`;
  record(id, metric, (await viewerCountry()).country, identity);
  return done;
}
