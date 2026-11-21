import Link from "next/link";
import { allBriefs, briefItems } from "@/lib/portal";
import { formatFee } from "@/lib/workflow";
import { allEvents } from "@/lib/events";
import { cancelBrief, completeBrief } from "@/app/admin/actions";
import { BriefForm } from "@/components/artists/ArtistForms";

const STATUS: Record<string, string> = { open: "Open", assigned: "In progress", in_review: "In review", done: "Done", cancelled: "Cancelled" };

export default function AdminBriefs() {
  const briefs = allBriefs();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Artist briefs</h1>
      <section className="glass p-5">
        <h2 className="mb-3 font-display text-lg font-bold">Post a brief</h2>
        <BriefForm events={allEvents().map((e) => ({ id: e.id, name: e.name, icon: e.icon }))} />
      </section>
      <section className="space-y-2">
        {briefs.map((b) => {
          const items = briefItems(b.id);
          const accepted = items.filter((i) => i.status === "approved" || i.status === "live").length;
          return (
            <div key={b.id} className="glass flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-bold">{b.title}</div>
                <div className="text-xs text-muted">
                  {b.quantity} × {b.item_type} · {formatFee(b.fee_amount, b.fee_currency)} · {b.assignee_name ? `@${b.assignee_username}` : "unclaimed"} · {accepted}/{b.quantity} approved
                </div>
                {items.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {items.map((i) => <Link key={i.id} href={`/admin/items/${i.id}`} className="chip py-0 text-xs">{i.name} · {i.status}</Link>)}
                  </div>
                )}
              </div>
              <span className="chip">{STATUS[b.status]}</span>
              {(b.status === "in_review" || b.status === "assigned") && accepted >= b.quantity && (
                <form action={completeBrief.bind(null, b.id)}><button className="btn btn-primary py-1.5">✓ Accept & queue payment</button></form>
              )}
              {(b.status === "open" || b.status === "assigned") && (
                <form action={cancelBrief.bind(null, b.id)}><button className="text-xs text-muted hover:text-chili">Cancel</button></form>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
