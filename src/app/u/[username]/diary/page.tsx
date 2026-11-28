import Link from "next/link";
import { notFound } from "next/navigation";
import { userByUsername } from "@/lib/auth";
import { diary } from "@/lib/queries";
import { CHAIN_BY_ID } from "@/lib/cinema";
import { Poster, Stars, Flag, Empty } from "@/components/ui";
import { getI18n } from "@/lib/i18n/server";
import { intlTag } from "@/lib/i18n/core";

export default async function DiaryPage({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const entries = diary(u.id);
  const { t, locale } = await getI18n();
  if (!entries.length) return <Empty>{t("diary.empty")}</Empty>;

  const months = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = e.watched_on.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }
  return (
    <div className="space-y-8">
      {[...months.entries()].map(([month, rows]) => (
        <section key={month}>
          <h2 className="section-title">{new Date(`${month}-01T00:00:00Z`).toLocaleDateString(intlTag(locale), { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
          <div className="card divide-y divide-line">
            {rows.map((e) => (
              <div key={e.id} className="flex items-center gap-4 px-4 py-2.5">
                <div className="w-10 text-center font-display text-2xl font-bold text-muted">{Number(e.watched_on.slice(8, 10))}</div>
                <div className="w-10 shrink-0"><Poster film={e} size="sm" /></div>
                <div className="min-w-0 flex-1">
                  <Link href={`/film/${e.slug}`} className="font-semibold hover:text-saffron">{e.title}</Link>{" "}
                  <span className="text-sm text-muted">{e.year}</span> <Flag code={e.country} />
                </div>
                <div className="hidden w-24 sm:block"><Stars rating={e.rating} /></div>
                <div className="flex w-28 items-center justify-end gap-2 text-sm">
                  {e.liked ? <span title={t("diary.liked")}>❤️</span> : null}
                  {e.rewatch ? <span title={t("diary.rewatch")}>🔁</span> : null}
                  {e.cinema_chain ? <span title={t("diary.seenAt", { cinema: CHAIN_BY_ID[e.cinema_chain]?.name ?? t("diary.aCinema") })}>🎟️</span> : null}
                  {e.review_id ? <Link href={`/review/${e.review_id}`} title={t("diary.review")} className="hover:text-saffron">📝</Link> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
