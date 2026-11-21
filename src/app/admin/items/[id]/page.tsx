import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { one } from "@/lib/db";
import { cardData } from "@/lib/profile";
import { allEvents } from "@/lib/events";
import { parseData, type CustomItemRow } from "@/lib/custom-items";
import type { CheckResult } from "@/lib/asset-spec";
import { ItemEditor } from "@/components/admin/ItemEditor";
import { ItemThread } from "@/components/ItemThread";
import { briefById, campaignById } from "@/lib/portal";

export default async function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const r = one<CustomItemRow>("SELECT * FROM custom_items WHERE id = ?", (await params).id);
  if (!r) notFound();
  const asset = r.asset_key ? one<{ checks: string }>("SELECT checks FROM assets WHERE key = ?", r.asset_key) : undefined;
  let assetChecks: CheckResult | null = null;
  try {
    assetChecks = asset ? (JSON.parse(asset.checks) as CheckResult) : null;
  } catch {}
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">{r.name}</h1>
      <ItemEditor
        key={`${r.id}-${r.updated_at}-${r.status}`}
        context={r.source === "partner" && r.campaign_id ? `Partner: ${campaignById(r.campaign_id)?.org_name} · ${campaignById(r.campaign_id)?.title}` : r.brief_id ? `Artist brief: ${briefById(r.brief_id)?.title}` : undefined}
        initial={{ ...r, data: parseData(r.data), assetChecks }}
        card={cardData(user)}
        events={[
          ...allEvents().map((e) => ({ id: e.id, name: e.name, icon: e.icon })),
          ...(r.campaign_id && !allEvents().some((e) => e.id === r.event) && r.event ? [{ id: r.event, name: `Campaign (not scheduled yet)`, icon: "📦" }] : []),
        ]}
      />
      <ItemThread itemId={r.id} />
    </div>
  );
}
