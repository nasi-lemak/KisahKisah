import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { listsByUser, savedLists } from "@/lib/queries";
import { ListCard } from "@/components/ListCard";
import { Empty } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function UserLists({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const t = await getT();
  const isMe = viewer?.id === u.id;
  const lists = listsByUser(u.id, viewer?.id ?? 0);
  const saved = savedLists(u.id, viewer?.id ?? 0);
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-bold">{isMe ? t("lists.yours") : t("lists.title")}</h2>
          {isMe && <Link href="/lists/new" className="btn btn-primary ml-auto py-1.5">{t("lists.new")}</Link>}
        </div>
        {lists.length ? <div className="grid gap-3 md:grid-cols-2">{lists.map((l) => <ListCard key={l.id} l={l} showVisibility={isMe} />)}</div> : <Empty>{t("lists.none")}</Empty>}
      </section>
      {saved.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">{t("lists.saved")}</h2>
          <div className="grid gap-3 md:grid-cols-2">{saved.map((l) => <ListCard key={l.id} l={l} />)}</div>
        </section>
      )}
    </div>
  );
}
