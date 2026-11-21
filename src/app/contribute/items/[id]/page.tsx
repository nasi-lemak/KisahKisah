import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { cardData } from "@/lib/profile";
import { parseData, type CustomItemRow } from "@/lib/custom-items";
import { briefById, campaignById, canContribute } from "@/lib/portal";
import type { CheckResult } from "@/lib/asset-spec";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { ItemThread } from "@/components/ItemThread";

export const metadata = { title: "Edit submission", robots: { index: false } };

/** Where partners and artists make their items. */
export default async function ContributeItem({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const r = one<CustomItemRow>("SELECT * FROM custom_items WHERE id = ?", (await params).id);
  if (!r) notFound();
  const staff = user.role === "admin" || user.role === "staff";
  if (!canContribute(user, r)) {
    if (staff) redirect(`/admin/items/${r.id}`);
    notFound();
  }
  const asset = r.asset_key ? one<{ checks: string }>("SELECT checks FROM assets WHERE key = ?", r.asset_key) : undefined;
  let assetChecks: CheckResult | null = null;
  try {
    assetChecks = asset ? (JSON.parse(asset.checks) as CheckResult) : null;
  } catch {}
  const campaign = r.campaign_id ? campaignById(r.campaign_id) : undefined;
  const brief = r.brief_id ? briefById(r.brief_id) : undefined;
  const back = campaign ? [`/partner/campaigns/${campaign.id}`, `← ${campaign.title}`] : brief ? [`/artists/briefs/${brief.id}`, `← ${brief.title}`] : ["/", "← Home"];
  return (
    <div className="space-y-6">
      <div>
        <Link href={back[0]} className="text-sm text-muted hover:text-text">{back[1]}</Link>
        <h1 className="font-display text-3xl font-extrabold">{r.name}</h1>
        <p className="text-sm text-muted">Upload, check and preview your artwork, then submit it to the KisahKisah team. <Link href="/specs" className="text-saffron">Artwork specs ↗</Link></p>
      </div>
      <ItemEditor
        key={`${r.id}-${r.updated_at}-${r.status}`}
        mode="contributor"
        context={campaign ? `${campaign.org_name} · ${campaign.title}` : brief ? `Brief: ${brief.title}` : undefined}
        initial={{ ...r, data: parseData(r.data), assetChecks }}
        card={cardData(user)}
        events={[]}
      />
      <ItemThread itemId={r.id} />
    </div>
  );
}
