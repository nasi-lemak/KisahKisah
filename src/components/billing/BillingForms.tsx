"use client";

import { acceptOrder, issueInvoice, saveBillingDetails, saveOrder } from "@/app/billing-actions";
import { Notice, Submit, useKeptAction } from "../forms";

type Line = { label: string; qty: number; unit: string };

export function OrderEditor({ o }: { o: { id: number; currency: string; lines: Line[]; discount: string; taxPct: number; tax_label: string; payment_terms: string; notes: string; valid_until: string | null } }) {
  const [state, action, pending] = useKeptAction(saveOrder);
  const rows = [...o.lines, ...Array.from({ length: Math.max(0, 4 - o.lines.length) }, () => ({ label: "", qty: 1, unit: "" }))];
  return (
    <form onSubmit={action} className="space-y-3 text-sm">
      <input type="hidden" name="order_id" value={o.id} />
      <div className="grid gap-2 sm:grid-cols-[1fr_70px_140px]">
        <span className="label mb-0">Line</span><span className="label mb-0">Qty</span><span className="label mb-0">Unit price ({o.currency})</span>
        {rows.map((l, i) => [
          <input key={`l${i}`} name={`label${i}`} defaultValue={l.label} className="input py-1.5" aria-label={`Line ${i + 1} description`} />,
          <input key={`q${i}`} name={`qty${i}`} type="number" min={1} step={1} defaultValue={l.qty} className="input py-1.5" aria-label={`Line ${i + 1} quantity`} />,
          <input key={`u${i}`} name={`unit${i}`} defaultValue={l.unit} inputMode="decimal" className="input py-1.5" aria-label={`Line ${i + 1} unit price`} />,
        ])}
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        <div><label className="label" htmlFor="o-cur">Currency</label><input id="o-cur" name="currency" defaultValue={o.currency} maxLength={3} className="input py-1.5 uppercase" /></div>
        <div><label className="label" htmlFor="o-disc">Discount</label><input id="o-disc" name="discount" defaultValue={o.discount} inputMode="decimal" className="input py-1.5" /></div>
        <div><label className="label" htmlFor="o-tax">Tax %</label><input id="o-tax" name="tax_rate" type="number" min={0} max={30} step={0.5} defaultValue={o.taxPct} className="input py-1.5" /></div>
        <div><label className="label" htmlFor="o-taxl">Tax label</label><input id="o-taxl" name="tax_label" defaultValue={o.tax_label} placeholder="SST 8%" className="input py-1.5" /></div>
        <div><label className="label" htmlFor="o-valid">Valid until</label><input id="o-valid" name="valid_until" type="date" defaultValue={o.valid_until ?? ""} className="input py-1.5" /></div>
      </div>
      <div><label className="label" htmlFor="o-terms">Payment terms</label><input id="o-terms" name="payment_terms" defaultValue={o.payment_terms} className="input py-1.5" /></div>
      <div><label className="label" htmlFor="o-notes">Notes on the order</label><textarea id="o-notes" name="notes" defaultValue={o.notes} className="input min-h-16" /></div>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-ghost">Save order</Submit>
    </form>
  );
}

export function IssueInvoiceForm({ orderId, left }: { orderId: number; left: string }) {
  const [state, action, pending] = useKeptAction(issueInvoice);
  return (
    <form onSubmit={action} className="flex flex-wrap items-end gap-2 text-sm">
      <input type="hidden" name="order_id" value={orderId} />
      <div><label className="label" htmlFor="inv-label">Invoice for</label><input id="inv-label" name="label" defaultValue="Deposit on signature" className="input py-1.5" /></div>
      <div><label className="label" htmlFor="inv-pct">% of order</label><input id="inv-pct" name="percent" type="number" min={1} max={100} defaultValue={50} className="input w-20 py-1.5" /></div>
      <div><label className="label" htmlFor="inv-due">Due in (days)</label><input id="inv-due" name="due_days" type="number" min={0} max={60} defaultValue={14} className="input w-20 py-1.5" /></div>
      <Submit pending={pending} className="btn btn-ghost">Issue invoice</Submit>
      <span className="text-xs text-muted">{left} left to invoice</span>
      <div className="w-full"><Notice state={state} /></div>
    </form>
  );
}

export function BillingDetailsForm({ campaignId, d }: { campaignId: number; d: { billing_name: string; billing_address: string; tax_id: string; billing_email: string } }) {
  const [state, action, pending] = useKeptAction(saveBillingDetails);
  return (
    <form onSubmit={action} className="grid gap-2 text-sm sm:grid-cols-2">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <div><label className="label" htmlFor="b-name">Legal company name</label><input id="b-name" name="billing_name" defaultValue={d.billing_name} className="input py-1.5" required /></div>
      <div><label className="label" htmlFor="b-tax">Tax / registration no.</label><input id="b-tax" name="tax_id" defaultValue={d.tax_id} className="input py-1.5" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="b-addr">Billing address</label><textarea id="b-addr" name="billing_address" defaultValue={d.billing_address} className="input min-h-16" required /></div>
      <div><label className="label" htmlFor="b-email">Accounts email</label><input id="b-email" name="billing_email" type="email" defaultValue={d.billing_email} className="input py-1.5" /></div>
      <div className="flex items-end"><Submit pending={pending} className="btn btn-ghost">Save billing details</Submit></div>
      <div className="sm:col-span-2"><Notice state={state} /></div>
    </form>
  );
}

export function AcceptOrderForm({ orderId, number }: { orderId: number; number: string }) {
  const [state, action, pending] = useKeptAction(acceptOrder);
  return (
    <form onSubmit={action} className="space-y-2 text-sm">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="number" value={number} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div><label className="label" htmlFor="sig-name">Your full name</label><input id="sig-name" name="name" className="input py-1.5" autoComplete="name" required /></div>
        <div><label className="label" htmlFor="sig-title">Job title</label><input id="sig-title" name="title" className="input py-1.5" autoComplete="organization-title" required /></div>
      </div>
      <label className="flex gap-2"><input type="checkbox" name="agree" required /> I'm authorised to sign for my company, and we accept order {number} and its terms.</label>
      <Notice state={state} />
      <Submit pending={pending} className="btn btn-primary">✍️ Accept and sign</Submit>
    </form>
  );
}
