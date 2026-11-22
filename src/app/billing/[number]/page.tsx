import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { buyer, canViewBilling, linesOf, seller, totalsOf, type InvoiceRow, type OrderRow } from "@/lib/billing";
import { DEFAULT_TERMS, formatMoney } from "@/lib/billing-core";
import { campaignById } from "@/lib/portal";
import { PrintButton } from "@/components/billing/PrintButton";

export const metadata = { title: "Billing document", robots: { index: false } };

export default async function BillingDoc({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const inv = /^KK-INV-/.test(number) ? one<InvoiceRow>("SELECT * FROM invoices WHERE number = ?", number) : undefined;
  const order = inv ? one<OrderRow>("SELECT * FROM orders WHERE id = ?", inv.order_id) : one<OrderRow>("SELECT * FROM orders WHERE number = ?", number);
  if (!order) notFound();
  const user = await currentUser();
  if (!canViewBilling(user, order.campaign_id)) notFound();
  const c = campaignById(order.campaign_id)!;
  const me = seller();
  const them = buyer(order.campaign_id)!;
  const t = totalsOf(order);
  const money = (n: number) => formatMoney(n, order.currency);
  const lines = linesOf(order);
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-8 text-[#15171c] shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-4">
        <div>
          <div className="font-display text-2xl font-extrabold">Kisah<span className="text-[#d98c00]">Kisah</span></div>
          <div className="whitespace-pre-line text-xs text-black/60">{me.name}{"\n"}{me.address}{me.taxId ? `\nTax ID ${me.taxId}` : ""}{me.email ? `\n${me.email}` : ""}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold uppercase tracking-widest text-black/50">{inv ? "Invoice" : "Order form"}</div>
          <div className="font-mono text-lg font-bold">{inv?.number ?? order.number}</div>
          <div className="text-xs text-black/60">
            {inv ? <>Issued {inv.issued_on} · Due {inv.due_on}<br />Order {order.number}</> : <>Created {order.created_at.slice(0, 10)}{order.valid_until ? ` · Valid until ${order.valid_until}` : ""}</>}
          </div>
          {inv && <div className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${inv.status === "paid" ? "bg-emerald-100 text-emerald-800" : inv.status === "void" ? "bg-black/10" : "bg-amber-100 text-amber-800"}`}>{inv.status.toUpperCase()}</div>}
        </div>
      </header>

      <section className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-black/50">Bill to</div>
          <div className="whitespace-pre-line">{them.billing_name || them.name}{"\n"}{them.billing_address}{them.tax_id ? `\nTax ID ${them.tax_id}` : ""}{them.billing_email ? `\n${them.billing_email}` : ""}</div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-black/50">Campaign</div>
          <div>{c.title} · {c.package} package</div>
          <div className="text-black/60">Markets {c.markets || "–"} · {c.starts_on ?? "?"} → {c.ends_on ?? "?"}</div>
        </div>
      </section>

      <table className="w-full text-sm">
        <thead><tr className="border-b border-black/20 text-left text-xs uppercase tracking-widest text-black/50"><th className="py-2">Description</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-black/5"><td className="py-2">{l.label}</td><td className="text-right">{l.qty}</td><td className="text-right">{money(l.unit)}</td><td className="text-right">{money(Math.round(l.qty * l.unit))}</td></tr>
          ))}
        </tbody>
        <tfoot className="text-right">
          <tr><td colSpan={3} className="pt-3">Subtotal</td><td className="pt-3">{money(t.subtotal)}</td></tr>
          {t.discount > 0 && <tr><td colSpan={3}>Discount</td><td>−{money(t.discount)}</td></tr>}
          {order.tax_rate > 0 && <tr><td colSpan={3}>{order.tax_label || `Tax ${order.tax_rate * 100}%`}</td><td>{money(t.tax)}</td></tr>}
          <tr className="font-bold"><td colSpan={3} className="pt-1">Order total</td><td className="pt-1">{money(t.total)}</td></tr>
          {inv && <tr className="text-lg font-extrabold"><td colSpan={3} className="pt-3">{inv.label}: amount due</td><td className="pt-3">{money(inv.amount)}</td></tr>}
          {inv && inv.tax > 0 && <tr className="text-xs text-black/60"><td colSpan={3}>of which tax</td><td>{money(inv.tax)}</td></tr>}
        </tfoot>
      </table>

      <section className="space-y-1 text-sm">
        <div><b>Payment terms:</b> {order.payment_terms}</div>
        {inv && <div className="whitespace-pre-line"><b>Pay to:</b> {me.bank}{inv.status === "paid" ? `\nPaid ${inv.paid_at?.slice(0, 10)}${inv.payment_ref ? ` · ref ${inv.payment_ref}` : ""}` : ""}</div>}
        {order.notes && <div className="whitespace-pre-line"><b>Notes:</b> {order.notes}</div>}
      </section>

      {!inv && (
        <section className="space-y-2 text-xs text-black/70">
          <div className="text-xs font-bold uppercase tracking-widest text-black/50">Terms</div>
          <div className="whitespace-pre-line">{order.terms || DEFAULT_TERMS}</div>
          <div className="mt-4 rounded-lg border border-black/10 p-3 text-sm text-black">
            {order.status === "accepted"
              ? <>✍️ Accepted electronically by <b>{order.accepted_name}</b>, {order.accepted_title}, for {them.billing_name || them.name} on {order.accepted_at} UTC.</>
              : order.status === "cancelled" ? "This order was cancelled." : "Not signed yet."}
          </div>
        </section>
      )}
      <div className="print:hidden"><PrintButton /></div>
    </article>
  );
}
