import Link from "next/link";
import { allCampaigns, campaignItems } from "@/lib/portal";
import { slotsFor } from "@/lib/workflow";
import { campaignPhase } from "@/components/partner/CampaignParts";

export default function AdminCampaigns() {
  const cs = allCampaigns();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Partner campaigns</h1>
      <p className="text-sm text-muted">Campaigns start from a partner inquiry: open <Link href="/admin/inquiries" className="text-saffron">Partner inquiries</Link> and choose “Set up partner”.</p>
      {cs.length === 0 ? (
        <div className="glass p-8 text-center text-muted">No campaigns yet.</div>
      ) : (
        <div className="space-y-2">
          {cs.map((c) => {
            const items = campaignItems(c.id);
            const review = items.filter((i) => i.status === "submitted").length;
            return (
              <Link key={c.id} href={`/admin/campaigns/${c.id}`} className="glass flex flex-wrap items-center gap-3 p-4 hover:ring-1 hover:ring-saffron/50">
                <span className="text-2xl">{c.motif}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">{c.title}</div>
                  <div className="text-xs text-muted">{c.org_name} · {c.package} · {items.length}/{slotsFor(c.package).length} items{review ? ` · ${review} awaiting review` : ""}</div>
                </div>
                {review > 0 && <span className="chip border-saffron text-saffron">Needs review</span>}
                <span className="chip">{campaignPhase(c).label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
