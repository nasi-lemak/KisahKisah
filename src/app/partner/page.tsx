import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { campaignItems, campaignsForUser, orgsForUser } from "@/lib/portal";
import { slotsFor } from "@/lib/workflow";
import { campaignPhase } from "@/components/partner/CampaignParts";

export const metadata: Metadata = { title: "Partner portal", robots: { index: false } };

export default async function PartnerHome({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const user = await requireUser("/partner");
  const { invite } = await searchParams;
  const orgs = orgsForUser(user.id);
  const campaigns = campaignsForUser(user.id);
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Partner portal</div>
        <h1 className="font-display text-4xl font-extrabold">{orgs.length ? orgs.map((o) => o.name).join(", ") : "Welcome, partner"}</h1>
      </div>
      {invite === "invalid" && <p className="rounded-xl bg-chili/10 p-3 text-sm text-red-300">That invite link isn't valid. Ask your KisahKisah contact for a new one.</p>}
      {invite === "used" && <p className="rounded-xl bg-chili/10 p-3 text-sm text-red-300">That invite link has already been used by someone else. Ask for a new one.</p>}
      {orgs.length === 0 ? (
        <div className="glass space-y-2 p-6 text-sm">
          <p>You're not on a partner team yet. Partners join through an invite link from the KisahKisah team.</p>
          <p className="text-muted">Want to promote a film or series? <Link href="/advertise" className="text-saffron">Tell us about it →</Link></p>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Campaigns</h2>
          {campaigns.map((c) => {
            const items = campaignItems(c.id);
            const slots = slotsFor(c.package).length;
            const phase = campaignPhase(c);
            return (
              <Link key={c.id} href={`/partner/campaigns/${c.id}`} className="glass flex flex-wrap items-center gap-4 p-4 transition hover:ring-1 hover:ring-saffron/50">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: `linear-gradient(135deg, ${c.color1}, ${c.color2})` }}>{c.motif}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-bold">{c.title}</div>
                  <div className="text-xs text-muted">{c.org_name} · {c.package} package · {items.length}/{slots} items uploaded</div>
                </div>
                <span className="chip">{phase.label}</span>
              </Link>
            );
          })}
        </section>
      )}
      <p className="text-sm text-muted">Artwork rules: <Link href="/specs" className="text-saffron">Artwork specs</Link></p>
    </div>
  );
}
