import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { listAccess, listById } from "@/lib/queries";
import { ListView } from "@/components/ListView";

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
  // Unlisted catalogues only open through their share link; private ones only for owner + collaborators.
  if (!listAccess(list, user?.id, false).view) notFound();
  return <ListView list={list} viewer={user} viaToken={false} />;
}
