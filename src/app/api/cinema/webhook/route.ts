import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { CHAIN_BY_ID, verifyWebhook, webhookSecret } from "@/lib/cinema";
import { recordPurchase } from "@/lib/purchases";

/**
 * Cinema partners call this when a linked member buys a ticket.
 *
 *   POST /api/cinema/webhook
 *   X-Kisah-Timestamp: <unix seconds>
 *   X-Kisah-Signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>">
 *   { "chain": "LPD", "memberRef": "LP123456", "ticketRef": "A1B2C3",
 *     "amount": 18.5, "currency": "MYR", "filmSlug": "ola-bola-2016" }
 *
 * Idempotent: replaying the same (chain, ticketRef) never double-awards.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const check = verifyWebhook(
    webhookSecret(),
    req.headers.get("x-kisah-timestamp"),
    req.headers.get("x-kisah-signature"),
    body,
  );
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 401 });

  let p: { chain?: string; memberRef?: string; ticketRef?: string; amount?: number; currency?: string; filmSlug?: string };
  try {
    p = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const chainId = String(p.chain ?? "").toUpperCase();
  if (!CHAIN_BY_ID[chainId]) return NextResponse.json({ error: "Unknown chain" }, { status: 400 });
  if (!p.memberRef || !p.ticketRef || typeof p.amount !== "number" || !p.currency) {
    return NextResponse.json({ error: "memberRef, ticketRef, amount and currency are required" }, { status: 400 });
  }

  const link = one<{ user_id: number }>(
    "SELECT user_id FROM cinema_links WHERE chain_id = ? AND member_ref = ?",
    chainId, String(p.memberRef).toUpperCase(),
  );
  if (!link) return NextResponse.json({ status: "ignored", reason: "member not linked" }, { status: 202 });

  const film = p.filmSlug ? one<{ id: number }>("SELECT id FROM films WHERE slug = ?", String(p.filmSlug)) : undefined;
  const res = recordPurchase({
    userId: link.user_id, chainId, ticketRef: String(p.ticketRef).slice(0, 64), filmId: film?.id,
    amount: p.amount, currency: p.currency, source: "webhook",
  });
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 422 });
  return NextResponse.json({ status: res.duplicate ? "duplicate" : "credited", points: res.points, localBonus: res.localBonus });
}
