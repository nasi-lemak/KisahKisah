import { all } from "@/lib/db";
import { formatFee } from "@/lib/workflow";
import { markPayoutPaid, reviewArtist } from "@/app/admin/actions";

type Row = { user_id: number; username: string; display_name: string; portfolio_url: string; bio: string; specialities: string; payout_details: string; status: string; created_at: string };
type Payout = { id: number; amount: number; currency: string; status: string; title: string; display_name: string; payout_details: string; paid_at: string | null; reference: string };

export default function AdminArtists() {
  const apps = all<Row>("SELECT a.*, u.username, u.display_name FROM artist_profiles a JOIN users u ON u.id = a.user_id ORDER BY a.status = 'applied' DESC, a.created_at DESC");
  const payouts = all<Payout>(
    "SELECT p.*, b.title, u.display_name, a.payout_details FROM payouts p JOIN briefs b ON b.id = p.brief_id JOIN users u ON u.id = p.user_id LEFT JOIN artist_profiles a ON a.user_id = p.user_id ORDER BY p.status = 'pending' DESC, p.id DESC",
  );
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Artists & payouts</h1>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Applications & roster</h2>
        {apps.length === 0 && <div className="glass p-6 text-sm text-muted">No applications yet. Artists apply at /artists.</div>}
        {apps.map((a) => (
          <div key={a.user_id} className="glass flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-bold">{a.display_name} <span className="font-normal text-muted">@{a.username}</span></div>
              <a href={a.portfolio_url} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-saffron">{a.portfolio_url} ↗</a>
              {a.bio && <p className="mt-1 text-muted">{a.bio}</p>}
              <div className="text-xs text-muted">{a.specialities || "no specialities listed"}</div>
            </div>
            <span className="chip capitalize">{a.status}</span>
            {a.status !== "approved" && <form action={reviewArtist.bind(null, a.user_id, "approved")}><button className="btn btn-primary py-1.5">Approve</button></form>}
            {a.status === "applied" && <form action={reviewArtist.bind(null, a.user_id, "rejected")}><button className="btn btn-ghost py-1.5">Decline</button></form>}
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">Payouts</h2>
        {payouts.length === 0 && <div className="glass p-6 text-sm text-muted">Payouts appear when you accept a brief.</div>}
        {payouts.map((p) => (
          <div key={p.id} className="glass flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-bold">{p.display_name} · {p.title}</div>
              <div className="text-xs text-muted">Pay to: <span className="select-all text-text">{p.payout_details || "(no details)"}</span></div>
            </div>
            <span className="font-mono font-bold">{formatFee(p.amount, p.currency)}</span>
            {p.status === "pending" ? (
              <form action={async (fd: FormData) => { "use server"; await markPayoutPaid(p.id, String(fd.get("reference") ?? "")); }} className="flex gap-2">
                <input name="reference" className="input w-40 py-1.5" placeholder="Transfer ref" aria-label="Transfer reference" />
                <button className="btn btn-ghost py-1.5">Mark paid</button>
              </form>
            ) : (
              <span className="chip text-jade">Paid {p.paid_at?.slice(0, 10)}{p.reference ? ` · ${p.reference}` : ""}</span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
