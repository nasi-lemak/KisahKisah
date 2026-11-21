import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { artistProfile, briefsForArtist, openBriefs } from "@/lib/portal";
import { formatFee } from "@/lib/workflow";

export const metadata: Metadata = { title: "Artist programme" };

const STATUS: Record<string, string> = { assigned: "In progress", in_review: "In review", done: "Accepted", cancelled: "Cancelled", open: "Open" };

export default async function ArtistsHome({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const user = await currentUser();
  const profile = user ? artistProfile(user.id) : undefined;
  const { limit } = await searchParams;
  const steps = [
    ["Apply", "Share your portfolio. We review applications every week."],
    ["Pick a brief", "Paid briefs for stickers, decorations, banners, themes and more, with the fee shown upfront."],
    ["Upload & preview", "Automatic checks catch size and transparency issues; see your work on a real profile."],
    ["Get feedback", "Comments and versions in one place until it's approved."],
    ["Get paid & credited", "Your name appears on the item in the Kedai. Fees are paid when the brief is accepted."],
  ];

  if (!profile || profile.status !== "approved") {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl border border-line p-8" style={{ background: "radial-gradient(circle at 20% 20%, #ec6fa544, transparent 50%), radial-gradient(circle at 80% 80%, #19b38a33, transparent 50%), var(--color-surface)" }}>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Artist programme</div>
          <h1 className="mt-1 font-display text-5xl font-extrabold">Draw for KisahKisah.</h1>
          <p className="mt-2 max-w-xl text-muted">Paid commissions for the stickers, avatar decorations and themes film lovers collect. Your name goes on everything you make.</p>
          <div className="mt-5">
            {!user ? (
              <Link href="/login?next=/artists/apply" className="btn btn-primary">Sign in to apply</Link>
            ) : profile?.status === "applied" ? (
              <span className="chip border-saffron text-saffron">⏳ Application received. We'll let you know.</span>
            ) : (
              <Link href="/artists/apply" className="btn btn-primary">{profile?.status === "rejected" ? "Apply again" : "Apply now"}</Link>
            )}
          </div>
        </section>
        <ol className="grid gap-3 sm:grid-cols-5">
          {steps.map(([t, d], i) => (
            <li key={t} className="glass p-4 text-sm">
              <div className="text-xs font-bold text-saffron">Step {i + 1}</div>
              <div className="font-bold">{t}</div>
              <p className="text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">Open briefs right now: {openBriefs().length}. <Link href="/specs" className="text-saffron">Artwork specs</Link></p>
      </div>
    );
  }

  const mine = briefsForArtist(user!.id);
  const payouts = all<{ id: number; amount: number; currency: string; status: string; title: string; paid_at: string | null; reference: string }>(
    "SELECT p.*, b.title FROM payouts p JOIN briefs b ON b.id = p.brief_id WHERE p.user_id = ? ORDER BY p.id DESC",
    user!.id,
  );
  const credited = all<{ n: number }>("SELECT COUNT(*) n FROM custom_items WHERE source = 'artist' AND submitted_by = ? AND status = 'live'", user!.id)[0]?.n ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Artist programme</div>
          <h1 className="font-display text-4xl font-extrabold">Hi, {user!.display_name} 🎨</h1>
          <p className="text-sm text-muted">{credited} of your pieces are live in the Kedai.</p>
        </div>
        <Link href="/artists/briefs" className="btn btn-primary">Browse open briefs ({openBriefs().length})</Link>
      </div>
      {limit && <p className="rounded-xl bg-saffron/10 p-3 text-sm">You can work on up to 3 briefs at once. Finish one first.</p>}
      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold">Your briefs</h2>
        {mine.length === 0 ? <div className="glass p-6 text-sm text-muted">No briefs yet. Pick one from the board.</div> : mine.map((b) => (
          <Link key={b.id} href={`/artists/briefs/${b.id}`} className="glass flex flex-wrap items-center gap-3 p-4 hover:ring-1 hover:ring-saffron/50">
            <div className="min-w-0 flex-1">
              <div className="font-bold">{b.title}</div>
              <div className="text-xs text-muted">{b.quantity} × {b.item_type} · {formatFee(b.fee_amount, b.fee_currency)}{b.due_on ? ` · due ${b.due_on}` : ""}</div>
            </div>
            <span className="chip">{STATUS[b.status]}</span>
          </Link>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold">Payments</h2>
        {payouts.length === 0 ? <p className="text-sm text-muted">Fees appear here when a brief is accepted.</p> : (
          <div className="glass divide-y divide-line">
            {payouts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm">
                <span className="flex-1">{p.title}</span>
                <span className="font-mono">{formatFee(p.amount, p.currency)}</span>
                <span className={`chip py-0 ${p.status === "paid" ? "text-jade" : "text-saffron"}`}>{p.status === "paid" ? `Paid ${p.paid_at?.slice(0, 10)}` : "Pending"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
