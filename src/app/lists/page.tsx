import Link from "next/link";
import type { Metadata } from "next";
import { recentLists } from "@/lib/queries";
import { ListCard } from "@/components/ListCard";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Catalogues" };

export default async function ListsPage() {
  const lists = recentLists(50);
  const t = await getT();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("lists.title")}</h1>
          <p className="text-muted">{t("lists.intro")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/collections" className="btn btn-ghost">{t("lists.collections")}</Link>
          <Link href="/lists/new" className="btn btn-primary">{t("lists.new")}</Link>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lists.map((l) => <ListCard key={l.id} l={l} />)}
      </div>
    </div>
  );
}
