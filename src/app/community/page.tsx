import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { leaderboard, recentReviews } from "@/lib/queries";
import { country } from "@/lib/regions";
import { Avatar, KP } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage() {
  const user = await currentUser();
  const leaders = leaderboard(10);
  const reviews = recentReviews(12, user?.id ?? 0);
  const games = reviews.filter((r) => r.game_type !== "none");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Community</h1>
          <p className="text-muted">The latest kisah from across the region.</p>
        </div>
        {games.length > 0 && (
          <section>
            <h2 className="section-title">🕹️ Reviews with mini games: play to win KP</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {games.map((r) => (
                <Link key={r.id} href={`/review/${r.id}`} className="card shrink-0 px-4 py-3 text-sm hover:border-saffron/60">
                  <div className="font-semibold">{r.film_title}</div>
                  <div className="text-xs text-muted">by {r.display_name} · {{ trivia: "❓ Kuiz", guess_rating: "⭐ Teka Bintang", emoji: "🧩 Emoji", popcorn: "🍿 Popcorn" }[r.game_type]}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section>
          <h2 className="section-title">Latest reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r.id} r={r} viewerId={user?.id} />)}
          </div>
        </section>
      </div>
      <aside>
        <h2 className="section-title">🏆 Leaderboard · KP earned</h2>
        <ol className="card divide-y divide-line">
          {leaders.map((l, i) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`w-6 text-center font-display text-lg font-bold ${i < 3 ? "text-saffron" : "text-muted"}`}>{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
              <Avatar item={l.avatar_item} frame={l.frame_item} size={32} />
              <div className="min-w-0 flex-1">
                <Link href={`/u/${l.username}`} className="block truncate font-semibold hover:text-saffron">{l.display_name} {country(l.home_country)?.flag}</Link>
                <div className="text-xs text-muted">{l.films} films · {l.achievements} achievements</div>
              </div>
              <KP n={l.earned} className="text-sm" />
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
