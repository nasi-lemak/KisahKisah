import "server-only";
import { one, run, tx } from "./db";
import { CHAIN_BY_ID, parseTicketCode, pointsForPurchase, webhookSecret } from "./cinema";
import { award, checkAchievements, notify } from "./rewards";

export type PurchaseInput = {
  userId: number;
  chainId: string;
  ticketRef: string;
  filmId?: number | null;
  amount: number;
  currency: string;
  source: "webhook" | "ticket-code";
};

export type PurchaseResult =
  | { ok: true; points: number; localBonus: boolean; duplicate: false }
  | { ok: true; duplicate: true; points: number; localBonus: boolean }
  | { ok: false; error: string };

/** Record a ticket purchase, award points, auto-log the film. Idempotent by (chain, ticketRef). */
export function recordPurchase(p: PurchaseInput): PurchaseResult {
  const chain = CHAIN_BY_ID[p.chainId];
  if (!chain) return { ok: false, error: "Unknown cinema chain" };
  const film = p.filmId ? one<{ id: number; country: string; title: string }>("SELECT id, country, title FROM films WHERE id = ?", p.filmId) : undefined;
  let calc: { points: number; localBonus: boolean };
  try {
    calc = pointsForPurchase({ chainId: p.chainId, amount: p.amount, currency: p.currency, filmCountry: film?.country });
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const existing = one<{ points: number; local_bonus: number }>(
    "SELECT points, local_bonus FROM cinema_purchases WHERE chain_id = ? AND ticket_ref = ?",
    p.chainId, p.ticketRef,
  );
  if (existing) return { ok: true, duplicate: true, points: existing.points, localBonus: !!existing.local_bonus };

  tx(() => {
    run(
      "INSERT INTO cinema_purchases (user_id, chain_id, ticket_ref, film_id, amount, currency, points, local_bonus, source) VALUES (?,?,?,?,?,?,?,?,?)",
      p.userId, p.chainId, p.ticketRef, film?.id ?? null, p.amount, p.currency.toUpperCase(), calc.points, calc.localBonus ? 1 : 0, p.source,
    );
    award(p.userId, calc.points, "cinema", `${p.chainId}:${p.ticketRef}`, `${chain.name} ticket${film ? ` · ${film.title}` : ""}${calc.localBonus ? " (local film ×2)" : ""}`, { silent: true });
    if (film) {
      run(
        "INSERT INTO logs (user_id, film_id, watched_on, cinema_chain, local_hour) VALUES (?,?,?,?,NULL)",
        p.userId, film.id, new Date().toISOString().slice(0, 10), p.chainId,
      );
      award(p.userId, 5, "log", `film:${film.id}`, `Logged ${film.title}`, { silent: true });
    }
    notify(p.userId, "cinema", "🎟️", `+${calc.points} KP from ${chain.name}`, film ? `Seen on the big screen: ${film.title}` : "Thanks for supporting cinemas!");
  });
  checkAchievements(p.userId);
  return { ok: true, duplicate: false, ...calc };
}

/** Redeem an e-ticket code. The demo adapter looks the ticket up in cinema_tickets. */
export function redeemTicketCode(userId: number, input: string): PurchaseResult {
  const parsed = parseTicketCode(webhookSecret(), input);
  if (!parsed) return { ok: false, error: "That code doesn't look right. Check for typos?" };
  const ticket = one<{ code: string; chain_id: string; film_id: number | null; amount: number; currency: string; redeemed_by: number | null }>(
    "SELECT * FROM cinema_tickets WHERE code = ?",
    parsed.code,
  );
  if (!ticket) return { ok: false, error: "The cinema doesn't recognise this ticket." };
  if (ticket.redeemed_by && ticket.redeemed_by !== userId) return { ok: false, error: "This ticket was already claimed by someone else." };
  const res = recordPurchase({
    userId, chainId: ticket.chain_id, ticketRef: ticket.code, filmId: ticket.film_id,
    amount: ticket.amount, currency: ticket.currency, source: "ticket-code",
  });
  if (res.ok) {
    run("UPDATE cinema_tickets SET redeemed_by = ?, redeemed_at = datetime('now'), points = ? WHERE code = ?", userId, res.points, ticket.code);
  }
  return res;
}
