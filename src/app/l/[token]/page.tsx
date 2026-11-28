import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { listAccess, listByToken } from "@/lib/queries";
import { ListView } from "@/components/ListView";
import { ReportButton } from "@/components/ReportButton";
import { one } from "@/lib/db";

type Params = Promise<{ token: string }>;

/** Short share link for a catalogue, like open.spotify.com/playlist/… */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const l = listByToken((await params).token);
  if (!l || l.visibility === "private") return { title: "Catalogue" };
  const description = l.description || `${l.item_count} films & series, curated by ${l.display_name} on KisahKisah.`;
  return {
    title: l.title,
    description,
    openGraph: { title: `${l.title} · a catalogue by ${l.display_name}`, description, type: "website" },
    twitter: { card: "summary_large_image", title: l.title, description },
    robots: l.visibility === "unlisted" ? { index: false } : undefined,
  };
}

export default async function SharedListPage({ params }: { params: Params }) {
  const list = listByToken((await params).token);
  if (!list) notFound();
  const user = await currentUser();
  if (!listAccess(list, user?.id, true).view) notFound();
  const hidden = one<{ h: string | null }>("SELECT hidden_at h FROM lists WHERE id = ?", list.id)?.h;
  const staff = user?.role === "staff" || user?.role === "admin";
  if (hidden && user?.id !== list.user_id && !staff) notFound();
  return (
    <>
      <ListView list={list} viewer={user} viaToken />
      {user?.id !== list.user_id && <div className="mt-6 text-right"><ReportButton type="list" id={list.id} signedIn={!!user} label="Report catalogue" /></div>}
    </>
  );
}
