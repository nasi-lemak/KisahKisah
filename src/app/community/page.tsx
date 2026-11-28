import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { leaderboard, recentReviews } from "@/lib/queries";
import { country } from "@/lib/regions";
import { Avatar, KP, StyledName } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const user = await currentUser();
  const t = await getT();
  const leaders = leaderboard(10);
  const reviews = recentReviews(12, user?.id ?? 0);
  const games = reviews.filter((r) => r.game_type !== "none");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold">{t("community.title")}</h1>
          <p className="text-muted">{t("community.intro")}</p>
        </div>
        {games.length > 0 && (
          <section>
            <h2 className="section-title">{t("community.games")}</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {games.map((r) => (
                <Link key={r.id} href={`/review/${r.id}`} className="card shrink-0 px-4 py-3 text-sm hover:border-saffron/60">
                  <div className="font-semibold">{r.film_title}</div>
                  <div className="text-xs text-muted">{t("community.by", { name: r.display_name })} · {{ trivia: "❓ Kuiz", guess_rating: "⭐ Teka Bintang", emoji: "🧩 Emoji", popcorn: "🍿 Popcorn" }[r.game_type]}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="section-title">{t("community.latest")}</h2>
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} viewerId={user?.id} />)}
          </div>
        </section>
      </div>
      <aside>
        <h2 className="section-title">{t("community.leaderboard")}</h2>
        <ol className="card divide-y divide-line">
          {leaders.map((l, i) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`w-6 text-center font-display text-lg font-bold ${i < 3 ? "text-saffron" : "text-muted"}`}>{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
              <Avatar item={l.avatar_item} frame={l.frame_item} size={32} />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${l.username}`} className="block truncate font-semibold hover:brightness-125"><StyledName name={l.display_name} style={l.namestyle_item} /> {country(l.home_country)?.flag}</Link>
                <div className="text-xs text-muted">{t("community.leaderStats", { films: l.films, achievements: l.achievements })}</div>
              </div>
              <KP n={l.earned} className="text-sm" />
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
