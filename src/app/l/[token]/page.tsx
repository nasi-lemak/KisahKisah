import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { listAccess, listByToken } from "@/lib/queries";
import { ListView } from "@/components/ListView";

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
  return <ListView list={list} viewer={user} viaToken />;
}
