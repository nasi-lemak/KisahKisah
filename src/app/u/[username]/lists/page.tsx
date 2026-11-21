import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { listsByUser } from "@/lib/queries";
import { ListCard } from "@/components/ListCard";
import { Empty } from "@/components/ui";

export default async function UserLists({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const lists = listsByUser(u.id);
  return (
    <div className="space-y-4">
      {viewer?.id === u.id && <Link href="/lists/new" className="btn btn-primary">＋ New catalogue</Link>}
      {lists.length ? (
        <div className="grid gap-3 md:grid-cols-2">{lists.map((l) => <ListCard key={l.id} l={l} />)}</div>
      ) : (
        <Empty>No catalogues yet.</Empty>
      )}
    </div>
  );
}
