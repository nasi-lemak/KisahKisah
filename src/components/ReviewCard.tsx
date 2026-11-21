import Link from "next/link";
import type { Review, ListSummary } from "@/lib/queries";
import { identifyPlatform } from "@/lib/regions";
import { ITEM_BY_ID } from "@/lib/shop";
import { parseStickers } from "@/lib/queries";
import { toggleLike } from "@/app/actions";
import { Poster, Sticker, Stars, UserChip, timeAgo } from "./ui";

const GAME_BADGE: Record<string, string> = {
  trivia: "❓ Kuiz",
  guess_rating: "⭐ Teka Bintang",
  emoji: "🧩 Emoji Riddle",
  popcorn: "🍿 Popcorn Catch",
};

export function ExternalLinks({ raw }: { raw: string }) {
  let links: string[] = [];
  try {
    links = JSON.parse(raw);
  } catch {}
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted">Also on</span>
      {links.map((url) => {
        const p = identifyPlatform(url);
        if (!p) return null;
        return (
          <a key={url} href={url} target="_blank" rel="noopener noreferrer nofollow" className="chip py-0.5 hover:border-saffron" style={{ borderColor: `${p.color}88` }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name} ↗
          </a>
        );
      })}
    </div>
  );
}

export function LikeButton({ r, viewerId }: { r: Pick<Review, "id" | "liked" | "like_count">; viewerId?: number }) {
  const label = `${r.liked ? "❤️" : "🤍"} ${r.like_count}`;
  if (!viewerId) return <span className="text-sm text-muted">{label}</span>;
  return (
    <form action={toggleLike.bind(null, r.id)}>
      <button className="text-sm text-muted hover:text-text" aria-label={r.liked ? "Unlike" : "Like"}>
        {label}
      </button>
    </form>
  );
}

export function ReviewCard({ r, viewerId, showFilm = true }: { r: Review; viewerId?: number; showFilm?: boolean }) {
  const hideRating = r.game_type === "guess_rating" && r.user_id !== viewerId;
  const title = r.title_item ? ITEM_BY_ID[r.title_item]?.value : null;
  return (
    <article className="card flex gap-4 p-4">
      {showFilm && (
        <div className="w-16 shrink-0 sm:w-20">
          <Poster film={{ slug: r.film_slug, title: r.film_title, year: r.film_year, country: r.film_country, motif: r.film_motif }} size="sm" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <UserChip u={r} size={24} />
          {title && <span className="text-xs italic text-lotus">{title}</span>}
          {hideRating ? <span className="text-xs text-muted">★ hidden (guess it!)</span> : <Stars rating={r.rating} />}
          <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
        </div>
        {showFilm && (
          <Link href={`/film/${r.film_slug}`} className="mt-1 block font-display text-lg font-bold hover:text-saffron">
            {r.film_title} <span className="font-sans text-sm font-normal text-muted">{r.film_year}</span>
          </Link>
        )}
        <Link href={`/review/${r.id}`} className="mt-1 block text-sm text-text/85 hover:text-text">
          {r.spoiler ? <span className="italic text-muted">⚠️ This review contains spoilers. Read on the review page.</span> : <span className="line-clamp-3">{r.body}</span>}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <LikeButton r={r} viewerId={viewerId} />
          <Link href={`/review/${r.id}#comments`} className="text-sm text-muted hover:text-text">💬 {r.comment_count}</Link>
          {parseStickers(r.sticker_summary).slice(0, 3).map((st) =>
            ITEM_BY_ID[st.id] ? (
              <span key={st.id} className="inline-flex items-center gap-1 text-xs font-bold text-muted">
                <Sticker id={st.id} size={18} animate={false} />
                {st.count}
              </span>
            ) : null,
          )}
          {GAME_BADGE[r.game_type] && (
            <Link href={`/review/${r.id}`} className="chip border-saffron/50 py-0.5 text-xs text-saffron">
              {GAME_BADGE[r.game_type]}: play
            </Link>
          )}
          <ExternalLinks raw={r.external_links} />
        </div>
      </div>
    </article>
  );
}

export type { ListSummary };
