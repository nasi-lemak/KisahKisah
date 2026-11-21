import { notFound } from "next/navigation";
import { userByUsername } from "@/lib/auth";
import { watchlist } from "@/lib/queries";
import { Poster, Empty } from "@/components/ui";

export default async function UserWatchlist({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const films = watchlist(u.id);
  if (!films.length) return <Empty>The watchlist is empty.</Empty>;
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {films.map((f) => <Poster key={f.id} film={f} />)}
    </div>
  );
}
