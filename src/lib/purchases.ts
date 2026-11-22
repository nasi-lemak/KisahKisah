import "server-only";
import { one, run, tx } from "./db";
import { CHAIN_BY_ID, parseTicketCode, pointsForPurchase, webhookSecret } from "./cinema";
import { award, checkAchievements, grantItem, notify } from "./rewards";
import { inMarkets, ticketBonus } from "./reminders-core";
import { ITEM_BY_ID } from "./shop";

export type PurchaseInput = {
  userId: number;
  chainId: string;
  ticketRef: string;
  filmId?: number | null;
  amount: number;
  currency: string;
  source: "webhook" | "ticket-code";
};

export type CampaignBonus = { campaign: string; points: number; item: string | null };

export type PurchaseResult =
  | { ok: true; points: number; localBonus: boolean; duplicate: false; campaignBonus?: CampaignBonus }
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

  let campaignBonus: CampaignBonus | undefined;
  tx(() => {
    const ins = run(
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
    if (film) campaignBonus = applyCampaignBonus(p.userId, film.id, Number(ins.lastInsertRowid), p.chainId, calc.points);
  });
  checkAchievements(p.userId);
  return { ok: true, duplicate: false, ...calc, campaignBonus };
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

/**
 * A live sponsored campaign for this title can top up partner-cinema tickets with
 * extra KP and an exclusive item, in the campaign's markets and dates only.
 */
function applyCampaignBonus(userId: number, filmId: number, purchaseId: number, chainId: string, basePoints: number): CampaignBonus | undefined {
  const day = new Date().toISOString().slice(0, 10);
  const c = one<{ id: number; title: string; markets: string; ticket_bonus_pct: number; ticket_item: string | null }>(
    `SELECT c.id, c.title, c.markets, c.ticket_bonus_pct, c.ticket_item FROM campaigns c JOIN films f ON f.slug = c.film_slug
     WHERE f.id = ? AND c.status = 'scheduled' AND c.starts_on <= ? AND c.ends_on >= ? AND (c.ticket_bonus_pct > 0 OR c.ticket_item IS NOT NULL)
     ORDER BY c.starts_on DESC LIMIT 1`,
    filmId, day, day,
  );
  if (!c) return undefined;
  const home = one<{ home_country: string }>("SELECT home_country FROM users WHERE id = ?", userId)?.home_country;
  if (!inMarkets(c.markets, home)) return undefined;
  const points = ticketBonus(basePoints, c.ticket_bonus_pct);
  if (points) award(userId, points, "campaign-ticket", `cmp:${c.id}:${purchaseId}`, `${c.title} launch bonus (+${c.ticket_bonus_pct}%)`, { silent: true });
  let item: string | null = null;
  if (c.ticket_item && ITEM_BY_ID[c.ticket_item] && !one("SELECT 1 x FROM inventory WHERE user_id = ? AND item_id = ?", userId, c.ticket_item)) {
    grantItem(userId, c.ticket_item, "campaign-ticket");
    item = c.ticket_item;
  }
  run("INSERT INTO campaign_ticket_bonuses (campaign_id, user_id, purchase_id, chain_id, points, item_id) VALUES (?,?,?,?,?,?)", c.id, userId, purchaseId, chainId, points, item);
  notify(userId, "campaign", "🎬", `${c.title} ticket bonus`, `+${points} KP${item ? ` and ${ITEM_BY_ID[item].name}` : ""} for seeing it at a partner cinema.`);
  return { campaign: c.title, points, item: item ? ITEM_BY_ID[item].name : null };
}
