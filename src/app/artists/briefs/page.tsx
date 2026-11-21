import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { isApprovedArtist, openBriefs } from "@/lib/portal";
import { formatFee } from "@/lib/workflow";
import { eventById } from "@/lib/events";
import { claimBrief } from "@/app/artists/actions";

export const metadata = { title: "Open briefs" };

export default async function BriefsBoard() {
  const user = await currentUser();
  const approved = user ? isApprovedArtist(user.id) : false;
  const briefs = openBriefs();
  return (
    <div className="space-y-4">
      <Link href="/artists" className="text-sm text-muted hover:text-text">← Artist programme</Link>
      <h1 className="font-display text-3xl font-extrabold">Open briefs</h1>
      {!approved && <p className="rounded-xl bg-saffron/10 p-3 text-sm">Only approved artists can claim briefs. <Link href="/artists" className="text-saffron">Join the programme →</Link></p>}
      {briefs.length === 0 ? <div className="glass p-8 text-center text-muted">No open briefs right now. New ones are announced in your notifications.</div> : (
        <div className="grid gap-3 md:grid-cols-2">
          {briefs.map((b) => {
            const ev = b.event ? eventById(b.event) : undefined;
            return (
              <article key={b.id} className="glass flex flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-bold">{b.title}</h2>
                  <span className="shrink-0 rounded-lg bg-jade/15 px-2 py-1 font-mono text-sm font-bold text-jade">{formatFee(b.fee_amount, b.fee_currency)}</span>
                </div>
                <div className="text-xs text-muted">{b.quantity} × {b.item_type}{b.due_on ? ` · due ${b.due_on}` : ""}{ev ? ` · for ${ev.icon} ${ev.name}` : ""}</div>
                <p className="line-clamp-4 whitespace-pre-line text-sm">{b.description}</p>
                {approved && (
                  <form action={claimBrief.bind(null, b.id)} className="mt-auto pt-2">
                    <button className="btn btn-primary">✋ Claim this brief</button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
