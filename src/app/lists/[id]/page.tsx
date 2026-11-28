import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { listAccess, listById } from "@/lib/queries";
import { ListView } from "@/components/ListView";
import { ReportButton } from "@/components/ReportButton";
import { one } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const l = listById(Number((await params).id));
  if (!l || l.visibility !== "public") return { title: "Catalogue" };
  return {
    title: l.title,
    description: l.description || `A catalogue of ${l.item_count} titles by ${l.display_name}`,
    openGraph: { images: [`/l/${l.share_token}/opengraph-image`] },
  };
}

export default async function ListPage({ params }: { params: Params }) {
  const id = Number((await params).id);
  const list = Number.isInteger(id) ? listById(id) : undefined;
  if (!list) notFound();
  const user = await currentUser();
  const t = await getT();
  // Unlisted catalogues only open through their share link; private ones only for owner + collaborators.
  if (!listAccess(list, user?.id, false).view) notFound();
  const hidden = one<{ h: string | null }>("SELECT hidden_at h FROM lists WHERE id = ?", list.id)?.h;
  const staff = user?.role === "staff" || user?.role === "admin";
  if (hidden && user?.id !== list.user_id && !staff) notFound();
  return (
    <>
      {hidden && <p className="mb-4 rounded-xl border border-chili/40 bg-chili/10 p-3 text-sm">{t("lists.hidden")}</p>}
      <ListView list={list} viewer={user} viaToken={false} />
      {user?.id !== list.user_id && <div className="mt-6 text-right"><ReportButton type="list" id={list.id} signedIn={!!user} label={t("lists.report")} /></div>}
    </>
  );
}
