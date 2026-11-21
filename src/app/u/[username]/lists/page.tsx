import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { listsByUser, savedLists } from "@/lib/queries";
import { ListCard } from "@/components/ListCard";
import { Empty } from "@/components/ui";

export default async function UserLists({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const isMe = viewer?.id === u.id;
  const lists = listsByUser(u.id, viewer?.id ?? 0);
  const saved = savedLists(u.id, viewer?.id ?? 0);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold">{isMe ? "Your catalogues" : "Catalogues"}</h2>
          {isMe && <Link href="/lists/new" className="btn btn-primary ml-auto py-1.5">＋ New catalogue</Link>}
        </div>
        {lists.length ? <div className="grid gap-3 md:grid-cols-2">{lists.map((l) => <ListCard key={l.id} l={l} showVisibility={isMe} />)}</div> : <Empty>No catalogues yet.</Empty>}
      </section>
      {saved.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">📌 Saved from others</h2>
          <div className="grid gap-3 md:grid-cols-2">{saved.map((l) => <ListCard key={l.id} l={l} />)}</div>
        </section>
      )}
    </div>
  );
}
