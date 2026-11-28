import Link from "next/link";
import { all } from "@/lib/db";
import { openReportGroups, targetInfo } from "@/lib/moderation";
import { REASONS, reasonSummary, type Reason } from "@/lib/moderation-core";
import { moderateAction } from "@/app/moderation-actions";

export default function ReportsQueue() {
  const groups = openReportGroups();
  const recent = all<{ action: string; target_type: string; target_id: number; note: string; created_at: string; username: string | null }>(
    "SELECT m.action, m.target_type, m.target_id, m.note, m.created_at, u.username FROM moderation_log m LEFT JOIN users u ON u.id = m.staff_id ORDER BY m.id DESC LIMIT 15",
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Reports</h1>
        <p className="text-sm text-muted">Most-reported first. Reviews, comments and catalogues reported by {process.env.MOD_AUTO_HIDE || 3}+ members are already hidden while they wait here; spoiler reports only blur.</p>
      </div>
      {groups.length === 0 && <div className="glass p-6 text-sm text-muted">Nothing to review. 🎉</div>}
      {groups.map((g) => {
        const info = targetInfo(g.target_type, g.target_id);
        const reasons = reasonSummary(g.reasons.split(",") as Reason[]);
        const act = moderateAction.bind(null, g.target_type, g.target_id);
        return (
          <article key={`${g.target_type}-${g.target_id}`} className="glass space-y-3 p-5" data-report={`${g.target_type}-${g.target_id}`}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="chip py-0 text-xs uppercase">{g.target_type}</span>
              <b>{g.n} report{g.n === 1 ? "" : "s"}</b>
              {reasons.map((r) => <span key={r.reason} className="chip py-0 text-xs">{REASONS[r.reason] ?? r.reason} ×{r.n}</span>)}
              {info?.hidden && <span className="chip border-chili py-0 text-xs text-red-300">{g.target_type === "user" ? "suspended" : "hidden"}</span>}
              {info && <Link href={info.url} className="ml-auto text-saffron">Open →</Link>}
            </div>
            {info ? (
              <blockquote className="whitespace-pre-line rounded-lg bg-black/25 p-3 text-sm">
                <span className="text-xs text-muted">@{info.author}: </span>{info.preview || <i className="text-muted">(empty)</i>}
              </blockquote>
            ) : <p className="text-sm text-muted">This was deleted.</p>}
            {g.notes && <p className="text-xs text-muted">Reporters said: {g.notes}</p>}
            <form action={act} className="flex flex-wrap items-center gap-2">
              <input name="note" className="input w-64 py-1 text-sm" placeholder="Reason shown to the author" aria-label="Moderator note" />
              {g.target_type !== "user" && <button name="action" value="hide" className="chip border-chili text-red-300">Remove</button>}
              {g.target_type === "review" && <button name="action" value="spoiler" className="chip">Mark as spoiler</button>}
              {g.target_type !== "user" && info?.hidden && <button name="action" value="restore" className="chip border-jade text-jade">Restore</button>}
              <button name="action" value="dismiss" className="chip">Dismiss</button>
              <button name="action" value="suspend" className="chip border-chili text-red-300">Suspend @{info?.author}</button>
            </form>
          </article>
        );
      })}
      <section className="glass space-y-1 p-5 text-sm">
        <h2 className="font-display text-lg font-bold">Recent decisions</h2>
        {recent.length === 0 && <p className="text-muted">None yet.</p>}
        {recent.map((m, i) => (
          <div key={i} className="flex flex-wrap gap-2"><span className="text-muted">{m.created_at}</span><b>{m.action}</b><span>{m.target_type} #{m.target_id}</span><span className="text-muted">{m.username ? `by @${m.username}` : "automatic"}{m.note ? ` · ${m.note}` : ""}</span></div>
        ))}
      </section>
    </div>
  );
}
