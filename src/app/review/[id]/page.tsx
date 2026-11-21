import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { commentsFor, gamePlay, gameStats, inventory, parseStickers, reviewById } from "@/lib/queries";
import { ITEMS } from "@/lib/shop";
import { StickerBar } from "@/components/StickerBar";
import { publicGame } from "@/lib/games";
import { ITEM_BY_ID } from "@/lib/shop";
import { Avatar, Poster, Stars, StyledName, UserChip, timeAgo } from "@/components/ui";
import { ExternalLinks, LikeButton } from "@/components/ReviewCard";
import { GamePanel, SpoilerText } from "@/components/games";
import { CommentForm, SignInPrompt } from "@/components/forms";
import { deleteReview } from "@/app/actions";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = reviewById(Number((await params).id));
  return { title: r ? `${r.display_name} on ${r.film_title}` : "Review" };
}

export default async function ReviewPage({ params }: { params: Params }) {
  const id = Number((await params).id);
  const user = await currentUser();
  const r = Number.isInteger(id) ? reviewById(id, user?.id ?? 0) : undefined;
  if (!r) notFound();

  const game = publicGame(r);
  const played = user ? gamePlay(user.id, r.id) ?? null : null;
  const isAuthor = user?.id === r.user_id;
  const hideRating = r.game_type === "guess_rating" && !isAuthor && !played;
  const comments = commentsFor(r.id);
  const title = r.title_item ? ITEM_BY_ID[r.title_item]?.value : null;
  const stickerCatalog = Object.fromEntries(ITEMS.filter((i) => i.type === "sticker").map((i) => [i.id, { id: i.id, name: i.name, value: i.value }]));
  const owned = user ? inventory(user.id).filter((id) => stickerCatalog[id]).map((id) => stickerCatalog[id]) : [];
  const film = { slug: r.film_slug, title: r.film_title, year: r.film_year, country: r.film_country, motif: r.film_motif };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <article className="card p-6">
        <div className="flex gap-5">
          <div className="w-24 shrink-0 sm:w-32">
            <Poster film={film} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <UserChip u={r} size={36} />
              {title && <span className="text-sm italic text-lotus">{title}</span>}
            </div>
            <Link href={`/film/${r.film_slug}`} className="mt-3 block font-display text-3xl font-bold hover:text-saffron">
              {r.film_title} <span className="font-sans text-lg font-normal text-muted">{r.film_year}</span>
            </Link>
            <div className="mt-1 flex items-center gap-3 text-sm">
              {hideRating ? <span className="chip border-saffron/50 text-saffron">★ rating hidden: play Teka Bintang below!</span> : <Stars rating={r.rating} className="text-lg" />}
              <span className="text-muted">{timeAgo(r.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 whitespace-pre-line text-[1.05rem] leading-relaxed">
          {r.spoiler ? <SpoilerText>{r.body}</SpoilerText> : r.body}
        </div>

        <div className="mt-5">
          <StickerBar reviewId={r.id} summary={parseStickers(r.sticker_summary)} mine={r.my_sticker} owned={owned} catalog={stickerCatalog} signedIn={!!user} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <LikeButton r={r} viewerId={user?.id} />
          <span className="text-sm text-muted">💬 {r.comment_count}</span>
          <ExternalLinks raw={r.external_links} />
          {isAuthor && (
            <form action={deleteReview.bind(null, r.id)} className="ml-auto">
              <button className="text-xs text-muted hover:text-chili">Delete review</button>
            </form>
          )}
        </div>
      </article>

      {game && (
        <GamePanel
          reviewId={r.id}
          game={game}
          author={r.display_name}
          previous={played}
          canPlay={!isAuthor}
          signedIn={!!user}
          stats={gameStats(r.id)}
        />
      )}

      <section id="comments" className="scroll-mt-24 space-y-4">
        <h2 className="section-title">Comments ({comments.length})</h2>
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Link href={`/u/${c.username}`}>
              <Avatar item={c.avatar_item} frame={c.frame_item} size={34} />
            </Link>
            <div className="card flex-1 px-4 py-2.5">
              <div className="text-sm">
                <Link href={`/u/${c.username}`} className="font-semibold hover:brightness-125"><StyledName name={c.display_name} style={c.namestyle_item} /></Link>{" "}
                <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-line text-sm">{c.body}</p>
            </div>
          </div>
        ))}
        {user ? <CommentForm reviewId={r.id} /> : <SignInPrompt what="join the conversation" next={`/review/${r.id}`} />}
      </section>
    </div>
  );
}
