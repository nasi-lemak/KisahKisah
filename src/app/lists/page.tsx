import Link from "next/link";
import type { Metadata } from "next";
import { recentLists } from "@/lib/queries";
import { ListCard } from "@/components/ListCard";

export const metadata: Metadata = { title: "Catalogues" };

export default function ListsPage() {
  const lists = recentLists(50);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Catalogues</h1>
          <p className="text-muted">Curated collections by the community: ranked countdowns, starter packs, comfort films.</p>
        </div>
        <Link href="/lists/new" className="btn btn-primary">＋ New catalogue</Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lists.map((l) => <ListCard key={l.id} l={l} />)}
      </div>
    </div>
  );
}
