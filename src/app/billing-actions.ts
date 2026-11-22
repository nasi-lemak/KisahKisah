"use server";

import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { one, run, tx } from "@/lib/db";
import { DEFAULT_TERMS, PACKAGE_PRICES, instalment, toMinor, type Line } from "@/lib/billing-core";
import { buyer, invoicedSoFar, nextNumber, orderForCampaign, totalsOf, type OrderRow } from "@/lib/billing";
import { campaignById, isOrgMember, notifyStaff, orgMembers } from "@/lib/portal";
import { notify } from "@/lib/rewards";
import { addDays, today } from "@/lib/events";
import type { FormState } from "./actions";

const touch = (campaignId: number) => {
  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/partner/campaigns/${campaignId}`);
};
const tellPartner = (orgId: number, icon: string, title: string, body: string) => { for (const m of orgMembers(orgId)) notify(m.id, "billing", icon, title, body); };

export async function createOrder(campaignId: number) {
  await requireStaff();
  const c = campaignById(campaignId);
  if (!c || orderForCampaign(c.id)) return;
  const p = PACKAGE_PRICES[c.package] ?? PACKAGE_PRICES.premiere;
  const lines: Line[] = [{ label: `${p.label}: ${c.title}`, qty: 1, unit: p.usd * 100 }];
  run(
    "INSERT INTO orders (campaign_id, number, currency, lines, valid_until) VALUES (?,?,?,?,?)",
    c.id, nextNumber("Q"), "USD", JSON.stringify(lines), addDays(today(), 30),
  );
  touch(c.id);
}

export async function saveOrder(_: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const o = one<OrderRow>("SELECT * FROM orders WHERE id = ?", Number(form.get("order_id")));
  if (!o) return { error: "Order not found." };
  if (o.status === "accepted" || o.status === "cancelled") return { error: "A signed or cancelled order can't be changed. Cancel it and make a new one." };
  const currency = String(form.get("currency") ?? "USD").toUpperCase().slice(0, 3);
  if (!/^[A-Z]{3}$/.test(currency)) return { error: "Currency must be a 3-letter code." };
  const lines: Line[] = [];
  for (let i = 0; i < 8; i++) {
    const label = String(form.get(`label${i}`) ?? "").trim().slice(0, 160);
    if (!label) continue;
    const qty = Number(form.get(`qty${i}`));
    const unit = toMinor(String(form.get(`unit${i}`) ?? ""), currency);
    if (!(qty > 0) || qty > 1000 || unit === null || unit < 0) return { error: `Check the quantity and price on line ${i + 1}.` };
    lines.push({ label, qty, unit });
  }
  if (!lines.length) return { error: "Add at least one line." };
  const discount = toMinor(String(form.get("discount") || "0"), currency);
  const taxPct = Number(form.get("tax_rate") || 0);
  if (discount === null || discount < 0 || !(taxPct >= 0 && taxPct <= 30)) return { error: "Check the discount and tax rate." };
  const valid = String(form.get("valid_until") ?? "");
  run(
    `UPDATE orders SET currency = ?, lines = ?, discount = ?, tax_rate = ?, tax_label = ?, payment_terms = ?, notes = ?, valid_until = ?,
       status = 'draft', sent_at = NULL, updated_at = datetime('now') WHERE id = ?`,
    currency, JSON.stringify(lines), discount, taxPct / 100, String(form.get("tax_label") ?? "").slice(0, 40),
    String(form.get("payment_terms") ?? "").slice(0, 300), String(form.get("notes") ?? "").slice(0, 600),
    /^\d{4}-\d{2}-\d{2}$/.test(valid) ? valid : null, o.id,
  );
  touch(o.campaign_id);
  return { ok: o.status === "sent" ? "Saved. It's back to draft: send it again for signature." : "Saved." };
}

export async function sendOrder(orderId: number) {
  await requireStaff();
  const o = one<OrderRow>("SELECT * FROM orders WHERE id = ?", orderId);
  if (!o || o.status !== "draft") return;
  run("UPDATE orders SET status = 'sent', terms = ?, sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?", DEFAULT_TERMS, o.id);
  const c = campaignById(o.campaign_id)!;
  tellPartner(c.org_id, "📄", `Order form ${o.number} is ready to sign`, `For ${c.title}. Review and accept it on your campaign page.`);
  touch(o.campaign_id);
}

export async function cancelOrder(orderId: number) {
  await requireStaff();
  const o = one<OrderRow>("SELECT * FROM orders WHERE id = ?", orderId);
  if (!o || o.status === "cancelled") return;
  if (invoicedSoFar(o.id) > 0) return; // void the invoices first
  // Kept on record under its number; the campaign can get a fresh order.
  run("UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", o.id);
  touch(o.campaign_id);
}

export async function saveBillingDetails(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const c = campaignById(Number(form.get("campaign_id")));
  if (!c || !isOrgMember(c.org_id, user.id)) return { error: "Not your campaign." };
  const s = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  if (!s("billing_name", 120) || !s("billing_address", 400)) return { error: "Add the legal company name and billing address." };
  run("UPDATE orgs SET billing_name = ?, billing_address = ?, tax_id = ?, billing_email = ? WHERE id = ?", s("billing_name", 120), s("billing_address", 400), s("tax_id", 60), s("billing_email", 120), c.org_id);
  touch(c.id);
  return { ok: "Billing details saved." };
}

export async function acceptOrder(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const o = one<OrderRow>("SELECT * FROM orders WHERE id = ?", Number(form.get("order_id")));
  const c = o && campaignById(o.campaign_id);
  if (!o || !c || !isOrgMember(c.org_id, user.id)) return { error: "Order not found." };
  if (o.status !== "sent") return { error: "This order isn't waiting for a signature." };
  if (o.valid_until && o.valid_until < today()) return { error: "This order has expired. Ask the KisahKisah team for a fresh one." };
  if (!buyer(c.id)?.billing_name) return { error: "Add your billing details first." };
  const name = String(form.get("name") ?? "").trim().slice(0, 100);
  const title = String(form.get("title") ?? "").trim().slice(0, 100);
  if (name.length < 3 || !title) return { error: "Type your full name and job title to sign." };
  if (form.get("agree") !== "on") return { error: "Tick the box to accept the terms." };
  if (form.get("number") !== o.number) return { error: "The order changed while you were reading it. Reload and check it again." };
  const done = run(
    "UPDATE orders SET status = 'accepted', accepted_at = datetime('now'), accepted_by = ?, accepted_name = ?, accepted_title = ? WHERE id = ? AND status = 'sent' AND updated_at = ?",
    user.id, name, title, o.id, o.updated_at,
  );
  if (Number(done.changes) !== 1) return { error: "The order changed while you were reading it. Reload and check it again." };
  notifyStaff("✍️", `${o.number} signed`, `${c.org_name} accepted the order for ${c.title}.`);
  touch(c.id);
  return { ok: "Signed. Thank you! Invoices will follow the payment terms." };
}

export async function issueInvoice(_: FormState, form: FormData): Promise<FormState> {
  await requireStaff();
  const o = one<OrderRow>("SELECT * FROM orders WHERE id = ?", Number(form.get("order_id")));
  if (!o || o.status !== "accepted") return { error: "Invoices need a signed order." };
  const label = String(form.get("label") ?? "").trim().slice(0, 120) || "Instalment";
  const percent = Number(form.get("percent"));
  const t = totalsOf(o);
  const result = tx(() => {
    const part = instalment(t.total, t.tax, invoicedSoFar(o.id), percent);
    if (!part) return null;
    const number = nextNumber("INV");
    const due = addDays(today(), Math.max(0, Math.min(60, Number(form.get("due_days")) || 14)));
    run("INSERT INTO invoices (order_id, number, label, amount, tax, issued_on, due_on) VALUES (?,?,?,?,?,?,?)", o.id, number, label, part.amount, part.tax, today(), due);
    return number;
  });
  if (!result) return { error: "Nothing left to invoice, or the percentage is invalid." };
  const c = campaignById(o.campaign_id)!;
  tellPartner(c.org_id, "🧾", `Invoice ${result}`, `${label} for ${c.title}. See your campaign page.`);
  touch(o.campaign_id);
  return { ok: `Issued ${result}.` };
}

export async function markInvoice(invoiceId: number, form: FormData) {
  await requireStaff();
  const inv = one<{ order_id: number; status: string }>("SELECT order_id, status FROM invoices WHERE id = ?", invoiceId);
  if (!inv) return;
  const action = String(form.get("action"));
  if (action === "paid" && inv.status === "unpaid") {
    run("UPDATE invoices SET status = 'paid', paid_at = datetime('now'), payment_ref = ? WHERE id = ?", String(form.get("ref") ?? "").slice(0, 80) || null, invoiceId);
  } else if (action === "void" && inv.status === "unpaid") {
    run("UPDATE invoices SET status = 'void' WHERE id = ?", invoiceId);
  }
  const o = one<{ campaign_id: number }>("SELECT campaign_id FROM orders WHERE id = ?", inv.order_id)!;
  touch(o.campaign_id);
}

