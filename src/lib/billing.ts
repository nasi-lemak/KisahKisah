import "server-only";
import { all, one } from "./db";
import { docNumber, orderTotals, type Line } from "./billing-core";
import type { User } from "./auth";
import { isOrgMember } from "./portal";

export type OrderRow = {
  id: number; campaign_id: number; number: string; status: "draft" | "sent" | "accepted" | "cancelled"; currency: string; lines: string;
  discount: number; tax_rate: number; tax_label: string; payment_terms: string; notes: string; terms: string; valid_until: string | null;
  sent_at: string | null; accepted_at: string | null; accepted_by: number | null; accepted_name: string | null; accepted_title: string | null;
  created_at: string; updated_at: string;
};
export type InvoiceRow = {
  id: number; order_id: number; number: string; label: string; amount: number; tax: number; issued_on: string; due_on: string;
  status: "unpaid" | "paid" | "void"; paid_at: string | null; payment_ref: string | null; created_at: string;
};

export const linesOf = (o: Pick<OrderRow, "lines">): Line[] => JSON.parse(o.lines) as Line[];
export const totalsOf = (o: OrderRow) => orderTotals(linesOf(o), o.discount, o.tax_rate);

export function orderForCampaign(campaignId: number): OrderRow | undefined {
  return one<OrderRow>("SELECT * FROM orders WHERE campaign_id = ? AND status != 'cancelled' ORDER BY id DESC LIMIT 1", campaignId);
}

export function invoicesFor(orderId: number): InvoiceRow[] {
  return all<InvoiceRow>("SELECT * FROM invoices WHERE order_id = ? ORDER BY id", orderId);
}

export function invoicedSoFar(orderId: number): number {
  return one<{ n: number }>("SELECT COALESCE(SUM(amount), 0) n FROM invoices WHERE order_id = ? AND status != 'void'", orderId)!.n;
}

/** Next sequential number for this year, e.g. KK-INV-2026-0003. */
export function nextNumber(kind: "Q" | "INV"): string {
  const year = new Date().getUTCFullYear();
  const table = kind === "Q" ? "orders" : "invoices";
  const n = one<{ n: number }>(`SELECT COUNT(*) n FROM ${table} WHERE number LIKE ?`, `KK-${kind}-${year}-%`)!.n;
  return docNumber(kind, year, n + 1);
}

/** Staff, or a member of the partner team the campaign belongs to. */
export function canViewBilling(user: User | null, campaignId: number): boolean {
  if (!user) return false;
  if (user.role === "staff" || user.role === "admin") return true;
  const c = one<{ org_id: number }>("SELECT org_id FROM campaigns WHERE id = ?", campaignId);
  return !!c && isOrgMember(c.org_id, user.id);
}

/** Our details for the documents. Set these in the environment for real paperwork. */
export function seller() {
  return {
    name: process.env.BILLING_NAME || "KisahKisah (set BILLING_NAME)",
    address: process.env.BILLING_ADDRESS || "Address not set (BILLING_ADDRESS)",
    taxId: process.env.BILLING_TAX_ID || "",
    email: process.env.BILLING_EMAIL || "",
    bank: process.env.BILLING_BANK || "Bank details are sent with each invoice (BILLING_BANK).",
  };
}

export function buyer(campaignId: number) {
  return one<{ org_id: number; name: string; billing_name: string; billing_address: string; tax_id: string; billing_email: string }>(
    "SELECT o.id org_id, o.name, o.billing_name, o.billing_address, o.tax_id, o.billing_email FROM campaigns c JOIN orgs o ON o.id = c.org_id WHERE c.id = ?", campaignId,
  );
}
