import Link from "next/link";
import { BillingPanel } from "@/components/billing/BillingPanel";
import { orderForCampaign } from "@/lib/billing";
import { QuizEditor } from "@/components/partner/QuizEditor";
import { quizFor, quizStats } from "@/lib/quiz";
import { QUIZ_MAX_QUESTIONS } from "@/lib/quiz-core";
import { saveQuizReward } from "@/app/quiz-actions";
import { notFound } from "next/navigation";
import { all } from "@/lib/db";
import { campaignById, campaignItems, orgMembers } from "@/lib/portal";
import { campaignReadiness, slotsFor } from "@/lib/workflow";
import { siteUrl } from "@/lib/site";
import { createInvite, returnCampaign } from "@/app/admin/actions";
import { ScheduleForm, TicketBonusForm } from "@/components/partner/CampaignForms";
import { CampaignReport, SlotGrid, Stepper } from "@/components/partner/CampaignParts";

export default async function AdminCampaign({ params }: { params: Promise<{ id: string }> }) {
  const c = campaignById(Number((await params).id));
  if (!c) notFound();
  const items = campaignItems(c.id);
  const ready = campaignReadiness(c, items, slotsFor(c.package).length);
  const members = orgMembers(c.org_id);
  const base = await siteUrl();
  const invites = all<{ token: string; used_by: number | null; created_at: string }>("SELECT token, used_by, created_at FROM org_invites WHERE org_id = ? ORDER BY created_at DESC", c.org_id);
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/campaigns" className="text-sm text-muted hover:text-text">← Campaigns</Link>
        <h1 className="font-display text-3xl font-extrabold">{c.motif} {c.title}</h1>
        <div className="text-sm text-muted">{c.org_name} · {c.package} package · markets {c.markets || "–"}</div>
      </div>
      <Stepper c={c} />

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Partner team</h2>
        <div className="text-sm">{members.length ? members.map((m) => `${m.display_name} (@${m.username})`).join(", ") : <span className="text-muted">Nobody has joined yet.</span>}</div>
        <div className="space-y-1 text-sm">
          {invites.map((i) => (
            <div key={i.token} className="flex flex-wrap items-center gap-2">
              <code className="select-all rounded bg-ink px-2 py-1 text-xs">{base}/partner/join/{i.token}</code>
              <span className="text-xs text-muted">{i.used_by ? "used" : "unused · send this to the partner"}</span>
            </div>
          ))}
        </div>
        <form action={createInvite.bind(null, c.org_id)}><button className="chip">＋ New invite link</button></form>
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Brief</h2>
        <div className="rounded-xl px-4 py-2 text-sm" style={{ background: `linear-gradient(90deg, ${c.color1}55, ${c.color2}33)` }}>
          <b>{c.title}</b> <span className="text-muted">{c.tagline || "(no tagline yet)"}</span>
        </div>
        <p className="text-sm text-muted">{c.synopsis || "No synopsis yet."}</p>
        <div className="text-xs text-muted">Release {c.release_date ?? "–"} · preferred dates {c.starts_on ?? "?"} → {c.ends_on ?? "?"} · licence {c.licence_confirmed ? `confirmed ${c.licence_at?.slice(0, 10)}` : "not confirmed"}</div>
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Items</h2>
        <SlotGrid c={c} items={items} href={(id) => `/admin/items/${id}`} />
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">📄 Order &amp; invoices</h2>
        <BillingPanel campaignId={c.id} mode="staff" />
      </section>

      <section className="glass space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-lg font-bold">❓ Official Kuiz</h2>
          <form action={saveQuizReward.bind(null, c.id)} className="ml-auto flex items-center gap-2 text-sm">
            <label htmlFor="quiz-reward">Reward for a full score base (KP)</label>
            <input id="quiz-reward" name="quiz_reward" type="number" min={0} max={100} defaultValue={c.quiz_reward} className="input w-20 py-1" />
            <button className="chip">Save</button>
          </form>
        </div>
        <QuizEditor campaignId={c.id} rows={quizFor(c.id)} max={QUIZ_MAX_QUESTIONS} locked={c.status === "scheduled" && quizStats(c.id).plays > 0} />
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">🎟️ Cinema ticket bonus</h2>
        <TicketBonusForm
          c={c}
          films={all<{ slug: string; title: string; year: number }>("SELECT slug, title, year FROM films ORDER BY title")}
          items={items.map((i) => ({ id: i.id, name: i.name }))}
        />
      </section>

      {c.status !== "scheduled" ? (
        <section className="glass space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Schedule</h2>
          <ul className="text-sm">{ready.map((r) => <li key={r.label}>{r.pass ? "✅" : "⬜"} {r.label}</li>)}</ul>
          {orderForCampaign(c.id)?.status !== "accepted" && <p className="text-xs text-saffron">⚠️ No signed order yet. Fine for pilots; otherwise get it signed before scheduling.</p>}
          <ScheduleForm c={c} />
          {c.status === "submitted" && (
            <form action={async (fd: FormData) => { "use server"; await returnCampaign(c.id, String(fd.get("note") ?? "")); }} className="flex gap-2 border-t border-line pt-3">
              <input name="note" className="input" placeholder="What should the partner change in the brief?" aria-label="Note to partner" required />
              <button className="btn btn-ghost">Return to partner</button>
            </form>
          )}
        </section>
      ) : (
        <section className="glass space-y-3 p-5">
          <h2 className="font-display text-lg font-bold">Report · live {c.starts_on} → {c.ends_on}</h2>
          <CampaignReport c={c} />
          <Link href={`/events/cmp-${c.id}`} className="text-sm text-saffron">Event page →</Link>
        </section>
      )}
    </div>
  );
}
