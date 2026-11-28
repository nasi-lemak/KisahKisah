import { notFound } from "next/navigation";
import { userByUsername } from "@/lib/auth";
import { watchlist } from "@/lib/queries";
import { Poster, Empty } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function UserWatchlist({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const films = watchlist(u.id);
  const t = await getT();
  if (!films.length) return <Empty>{t("profile.watchlistEmpty")}</Empty>;
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {films.map((f) => <Poster key={f.id} film={f} />)}
    </div>
  );
}
