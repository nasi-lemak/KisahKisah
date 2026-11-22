import Link from "next/link";
import { buyer, invoicedSoFar, invoicesFor, linesOf, orderForCampaign, totalsOf } from "@/lib/billing";
import { formatMoney, minorDigits } from "@/lib/billing-core";
import { cancelOrder, createOrder, markInvoice, sendOrder } from "@/app/billing-actions";
import { AcceptOrderForm, BillingDetailsForm, IssueInvoiceForm, OrderEditor } from "./BillingForms";

const STATUS: Record<string, string> = { draft: "Draft", sent: "Waiting for signature", accepted: "Signed", cancelled: "Cancelled", unpaid: "Unpaid", paid: "Paid", void: "Void" };

/** Order form and invoices for one campaign. Staff manage; partners sign and pay. */
export function BillingPanel({ campaignId, mode }: { campaignId: number; mode: "staff" | "partner" }) {
  const o = orderForCampaign(campaignId);
  const b = buyer(campaignId);
  if (!o) {
    return mode === "staff" ? (
      <form action={createOrder.bind(null, campaignId)} className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted">No order form yet.</span>
        <button className="btn btn-ghost">Create order from the package</button>
      </form>
    ) : (
      <p className="text-sm text-muted">The KisahKisah team will send an order form to sign here.</p>
    );
  }
  const t = totalsOf(o);
  const money = (n: number) => formatMoney(n, o.currency);
  const invoices = invoicesFor(o.id);
  const d = minorDigits(o.currency);
  const plain = (n: number) => (n / 10 ** d).toFixed(d);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/billing/${o.number}`} className="font-mono font-semibold text-saffron">{o.number}</Link>
        <span className={`chip py-0 text-xs ${o.status === "accepted" ? "border-jade text-jade" : o.status === "sent" ? "border-saffron text-saffron" : ""}`}>{STATUS[o.status]}</span>
        <span className="ml-auto font-display text-lg font-bold">{money(t.total)}</span>
      </div>
      {o.status === "accepted" && <p className="text-xs text-muted">Signed by {o.accepted_name} ({o.accepted_title}) on {o.accepted_at?.slice(0, 16)} UTC.</p>}

      {mode === "staff" && (o.status === "draft" || o.status === "sent") && (
        <>
          <OrderEditor o={{ id: o.id, currency: o.currency, lines: linesOf(o).map((l) => ({ label: l.label, qty: l.qty, unit: plain(l.unit) })), discount: plain(o.discount), taxPct: Math.round(o.tax_rate * 1000) / 10, tax_label: o.tax_label, payment_terms: o.payment_terms, notes: o.notes, valid_until: o.valid_until }} />
          <div className="flex flex-wrap gap-2">
            {o.status === "draft" && <form action={sendOrder.bind(null, o.id)}><button className="btn btn-primary">Send for signature</button></form>}
            <form action={cancelOrder.bind(null, o.id)}><button className="btn btn-ghost">Cancel order</button></form>
            {!b?.billing_name && <span className="self-center text-xs text-muted">The partner hasn't added billing details yet.</span>}
          </div>
        </>
      )}

      {mode === "partner" && o.status !== "accepted" && (
        <div className="space-y-3">
          <BillingDetailsForm campaignId={campaignId} d={b ?? { billing_name: "", billing_address: "", tax_id: "", billing_email: "" }} />
          {o.status === "sent" && (
            <div className="space-y-2 rounded-xl border border-saffron/40 p-3">
              <p>Read the <Link href={`/billing/${o.number}`} className="text-saffron">order form and terms</Link> ({money(t.total)}), then sign.</p>
              <AcceptOrderForm orderId={o.id} number={o.number} />
            </div>
          )}
          {o.status === "draft" && <p className="text-muted">The team is preparing your order form.</p>}
        </div>
      )}

      {(o.status === "accepted" || invoices.length > 0) && (
        <div className="space-y-2">
          <h3 className="font-bold">Invoices</h3>
          {invoices.length === 0 && <p className="text-muted">None yet.</p>}
          {invoices.map((inv) => (
            <div key={inv.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
              <Link href={`/billing/${inv.number}`} className="font-mono text-saffron">{inv.number}</Link>
              <span>{inv.label}</span>
              <span className="font-semibold">{money(inv.amount)}</span>
              <span className={`chip py-0 text-xs ${inv.status === "paid" ? "border-jade text-jade" : inv.status === "unpaid" ? "border-saffron text-saffron" : ""}`}>{STATUS[inv.status]}{inv.status === "unpaid" ? ` · due ${inv.due_on}` : ""}</span>
              {mode === "staff" && inv.status === "unpaid" && (
                <form action={markInvoice.bind(null, inv.id)} className="ml-auto flex gap-1">
                  <input name="ref" placeholder="Payment ref" aria-label={`Payment reference for ${inv.number}`} className="input w-36 py-1 text-xs" />
                  <button name="action" value="paid" className="chip">Mark paid</button>
                  <button name="action" value="void" className="chip">Void</button>
                </form>
              )}
            </div>
          ))}
          {mode === "staff" && o.status === "accepted" && invoicedSoFar(o.id) < t.total && <IssueInvoiceForm orderId={o.id} left={money(t.total - invoicedSoFar(o.id))} />}
        </div>
      )}
    </div>
  );
}
