import Link from "next/link";
import { BillingPanel } from "@/components/billing/BillingPanel";
import { QuizEditor } from "@/components/partner/QuizEditor";
import { quizFor } from "@/lib/quiz";
import { QUIZ_MAX_QUESTIONS } from "@/lib/quiz-core";
import { all } from "@/lib/db";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { campaignById, campaignItems, isOrgMember } from "@/lib/portal";
import { COUNTRIES } from "@/lib/regions";
import { slotsFor } from "@/lib/workflow";
import { startSlot } from "@/app/partner/actions";
import { CampaignBriefForm, SubmitCampaignForm } from "@/components/partner/CampaignForms";
import { CampaignReport, SlotGrid, Stepper } from "@/components/partner/CampaignParts";

export const metadata = { title: "Campaign", robots: { index: false } };

export default async function PartnerCampaign({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const c = campaignById(Number((await params).id));
  if (!c || !isOrgMember(c.org_id, user.id)) notFound();
  const items = campaignItems(c.id);
  const slots = slotsFor(c.package);
  const locked = c.status !== "brief";
  const drafts = items.filter((i) => i.status === "draft").length;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/partner" className="text-sm text-muted hover:text-text">← Partner portal</Link>
        <h1 className="font-display text-4xl font-extrabold">{c.motif} {c.title}</h1>
        <div className="text-sm text-muted">{c.org_name} · {c.package} package</div>
      </div>
      <Stepper c={c} />

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-xl font-bold">1 · The brief</h2>
        <CampaignBriefForm c={c} countries={COUNTRIES} locked={locked} films={all<{ slug: string; title: string; year: number }>("SELECT slug, title, year FROM films ORDER BY title")} />
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-xl font-bold">📄 Order form &amp; invoices</h2>
        <BillingPanel campaignId={c.id} mode="partner" />
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-xl font-bold">Official Kuiz <span className="text-sm font-normal text-muted">(optional)</span></h2>
        <p className="text-sm text-muted">Up to {QUIZ_MAX_QUESTIONS} multiple-choice questions fans play once on your event page for KP. Keep them spoiler-free and fun.</p>
        <QuizEditor campaignId={c.id} rows={quizFor(c.id)} max={QUIZ_MAX_QUESTIONS} locked={locked} />
      </section>

      <section className="glass space-y-3 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold">2 · Artwork ({items.length}/{slots.length})</h2>
          <Link href="/specs" className="text-xs text-saffron">Artwork specs ↗</Link>
        </div>
        <p className="text-sm text-muted">Open each slot to upload, check and preview the artwork, then submit it. You'll see comments from the KisahKisah team there.</p>
        <SlotGrid
          c={c}
          items={items}
          href={(id) => `/contribute/items/${id}`}
          start={locked ? undefined : (i) => (
            <form action={startSlot.bind(null, c.id, i)} className="w-full">
              <button className="btn btn-primary w-full justify-center py-1 text-xs">Start</button>
            </form>
          )}
        />
      </section>

      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-xl font-bold">3 · Submit</h2>
        {c.status === "brief" ? (
          <>
            {drafts > 0 && <p className="text-sm text-muted">{drafts} item{drafts > 1 ? "s are" : " is"} still a draft. Submit each one from its page first.</p>}
            <SubmitCampaignForm id={c.id} />
          </>
        ) : (
          <p className="text-sm">✓ Submitted {c.licence_at?.slice(0, 10)}. {c.status === "scheduled" ? `Scheduled ${c.starts_on} → ${c.ends_on}.` : "The team is reviewing it."}</p>
        )}
      </section>

      {c.status === "scheduled" && (
        <section className="glass space-y-3 p-5">
          <h2 className="font-display text-xl font-bold">Report</h2>
          <CampaignReport c={c} />
          <Link href={`/events/cmp-${c.id}`} className="text-sm text-saffron">View the live event page →</Link>
        </section>
      )}
    </div>
  );
}
