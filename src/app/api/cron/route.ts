import { timingSafeEqual } from "node:crypto";
import { runJobs } from "@/lib/jobs";

/**
 * Scheduled jobs (release reminders, cleanup). Call hourly from your scheduler:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your.site/api/cron
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Set CRON_SECRET to enable scheduled jobs." }, { status: 503 });
  const given = Buffer.from((req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ ok: true, ran: await runJobs() });
}

// Some schedulers (e.g. Vercel Cron) send GET.
export const GET = POST;
