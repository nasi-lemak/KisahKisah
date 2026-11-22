/** Pure money maths for order forms and invoices. All amounts are integer minor units (cents). */

export type Line = { label: string; qty: number; unit: number };

export function minorDigits(currency: string): number {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

export function formatMoney(minor: number, currency: string): string {
  const d = minorDigits(currency);
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: d, maximumFractionDigits: d }).format(minor / 10 ** d);
}

/** "12,000.50" → 1200050 (for a 2-decimal currency). Returns null for junk. */
export function toMinor(raw: string, currency: string): number | null {
  const clean = raw.replace(/[,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return null;
  return Math.round(Number(clean) * 10 ** minorDigits(currency));
}

export function orderTotals(lines: Line[], discount: number, taxRate: number) {
  const subtotal = lines.reduce((a, l) => a + Math.round(l.qty * l.unit), 0);
  const disc = Math.min(Math.max(0, discount), subtotal);
  const taxable = subtotal - disc;
  const tax = Math.round(taxable * Math.max(0, taxRate));
  return { subtotal, discount: disc, taxable, tax, total: taxable + tax };
}

/** An instalment of `percent` of the order, never more than what's left to invoice. */
export function instalment(total: number, tax: number, alreadyInvoiced: number, percent: number): { amount: number; tax: number } | null {
  const left = total - alreadyInvoiced;
  if (left <= 0 || !(percent > 0)) return null;
  const amount = Math.min(left, Math.round((total * Math.min(100, percent)) / 100));
  // Tax is reported pro rata so the instalments' tax adds up to the order's.
  const taxPart = total ? Math.round((tax * amount) / total) : 0;
  return { amount, tax: taxPart };
}

export function docNumber(prefix: "Q" | "INV", year: number, seq: number): string {
  return `KK-${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

/** Starting prices (USD, one market cluster); staff adjust per deal. Mirrors docs/PROMOTIONS.md. */
export const PACKAGE_PRICES: Record<string, { label: string; usd: number }> = {
  indie: { label: "Indie Spotlight package (7 days, subsidised)", usd: 500 },
  trailer: { label: "Trailer Drop package (7 days)", usd: 3000 },
  premiere: { label: "Premiere package (14 days)", usd: 12000 },
  blockbuster: { label: "Blockbuster Takeover package (21–30 days)", usd: 40000 },
};

export const DEFAULT_TERMS = `1. Scope. KisahKisah runs the campaign described in this order: placements, items and dates as listed, in the markets listed.
2. Editorial independence. Sponsors cannot buy, boost, hide or remove ratings, reviews, comments or scores. Sponsored placements are labelled "Sponsored".
3. Licence. The partner confirms it owns or is licensed to use all artwork, names, logos and characters supplied, in the markets and dates of the campaign, and grants KisahKisah a licence to display them for the campaign and to keep items already claimed by members.
4. Data. Reports contain aggregated figures only. No personal data is shared.
5. Payment. As stated in the payment terms. Late invoices may delay or pause the campaign.
6. Changes and cancellation. Date changes need 7 days' notice. Cancelling after artwork review starts makes the first instalment non-refundable.
7. Liability. Each party's liability is limited to the fees in this order, except for breaches of the licence warranty.
Template terms: have them reviewed by counsel for each market before use.`;
