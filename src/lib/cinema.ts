/**
 * Cinema partner integration (pure logic, no DB).
 *
 * Two ways a purchase earns Kisah Points:
 *  1. Linked membership: the cinema POSTs a signed webhook to
 *     /api/cinema/webhook whenever a linked member buys a ticket.
 *  2. Ticket code: the member types the code printed on their e-ticket.
 *     A CinemaAdapter verifies it (the demo adapter checks a checksum and
 *     looks the ticket up locally; a real one would call the chain's API).
 *
 * The chains below are fictional demo partners. Adding a real one means
 * adding an entry and an adapter, nothing else.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { country } from "./regions.ts";

export type CinemaChain = {
  id: string; // also the ticket-code prefix
  name: string;
  country: string;
  color: string;
  tagline: string;
  /** Promo multiplier on points, e.g. 1.5 for a launch partner. */
  multiplier: number;
};

export const CHAINS: CinemaChain[] = [
  { id: "LPD", name: "Layar Perdana", country: "MY", color: "#dc2626", tagline: "Kuala Lumpur · Penang · Johor Bahru", multiplier: 1.5 },
  { id: "MPH", name: "Merlion Picturehouse", country: "SG", color: "#0ea5e9", tagline: "Orchard · Jurong · Tampines", multiplier: 1 },
  { id: "BTC", name: "Bintang Cineplex", country: "ID", color: "#f59e0b", tagline: "Jakarta · Bandung · Surabaya · Bali", multiplier: 1 },
  { id: "SSC", name: "Chao Phraya Screens", country: "TH", color: "#a855f7", tagline: "Bangkok · Chiang Mai · Phuket", multiplier: 1 },
  { id: "SNR", name: "Sinehan Republika", country: "PH", color: "#2563eb", tagline: "Manila · Cebu · Davao", multiplier: 1.2 },
  { id: "SMC", name: "Sao Mai Cinemas", country: "VN", color: "#16a34a", tagline: "Hà Nội · TP.HCM · Đà Nẵng", multiplier: 1 },
  { id: "HBC", name: "Hanbit Cinema", country: "KR", color: "#ec4899", tagline: "Seoul · Busan · Daegu", multiplier: 1 },
];

export const CHAIN_BY_ID: Record<string, CinemaChain> = Object.assign(Object.create(null), Object.fromEntries(CHAINS.map((c) => [c.id, c])));

/** Watching a film from the cinema's own country earns double. */
export const LOCAL_FILM_BONUS = 2;
export const MAX_POINTS_PER_TICKET = 400;

export function pointsForPurchase(opts: { chainId: string; amount: number; currency: string; filmCountry?: string | null }): {
  points: number;
  localBonus: boolean;
} {
  const chain = CHAIN_BY_ID[opts.chainId];
  if (!chain) throw new Error("Unknown cinema chain");
  const c = country(chain.country);
  if (!c || c.currency !== opts.currency.toUpperCase()) throw new Error(`Currency must be ${c?.currency}`);
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) throw new Error("Amount must be positive");
  const localBonus = !!opts.filmCountry && opts.filmCountry === chain.country;
  const raw = opts.amount * c.pointsPerUnit * chain.multiplier * (localBonus ? LOCAL_FILM_BONUS : 1);
  return { points: Math.max(1, Math.min(MAX_POINTS_PER_TICKET, Math.round(raw))), localBonus };
}

// ── Webhook signatures ──────────────────────────────────────────────

export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function signWebhook(secret: string, timestamp: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function verifyWebhook(
  secret: string,
  timestamp: string | null,
  signature: string | null,
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { ok: true } | { ok: false; error: string } {
  if (!timestamp || !signature) return { ok: false, error: "Missing signature headers" };
  const ts = Number(timestamp);
  if (!Number.isInteger(ts)) return { ok: false, error: "Bad timestamp" };
  if (Math.abs(nowSeconds - ts) > SIGNATURE_TOLERANCE_SECONDS) return { ok: false, error: "Timestamp outside tolerance" };
  const expected = Buffer.from(signWebhook(secret, timestamp, body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, error: "Invalid signature" };
  return { ok: true };
}

// ── Ticket codes: PREFIX-XXXXXX-CC (Crockford base32, CC = checksum) ──

const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function checksum(secret: string, prefix: string, body: string): string {
  const h = createHmac("sha256", secret).update(`${prefix}-${body}`).digest();
  return B32[h[0] % 32] + B32[h[1] % 32];
}

export function makeTicketCode(secret: string, chainId: string, random: Uint8Array): string {
  if (random.length < 6) throw new Error("need 6 random bytes");
  const body = Array.from(random.slice(0, 6), (b) => B32[b % 32]).join("");
  return `${chainId}-${body}-${checksum(secret, chainId, body)}`;
}

/** Uppercase and fix look-alike characters (O→0, I/L→1) in the random part only. */
export function normaliseTicketCode(input: string): string {
  const parts = input.toUpperCase().replace(/[\s_]/g, "").split("-");
  if (parts.length !== 3) return parts.join("-");
  const fix = (s: string) => s.replace(/O/g, "0").replace(/[IL]/g, "1");
  return [parts[0], fix(parts[1]), fix(parts[2])].join("-");
}

export function parseTicketCode(secret: string, input: string): { chainId: string; code: string } | null {
  const code = normaliseTicketCode(input);
  const m = /^([A-Z]{3})-([0-9A-Z]{6})-([0-9A-Z]{2})$/.exec(code);
  if (!m) return null;
  const [, prefix, body, check] = m;
  if (!CHAIN_BY_ID[prefix]) return null;
  if (checksum(secret, prefix, body) !== check) return null;
  return { chainId: prefix, code };
}

export function webhookSecret(): string {
  return process.env.CINEMA_WEBHOOK_SECRET || "dev-only-kisahkisah-secret";
}
