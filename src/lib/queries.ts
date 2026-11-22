import "server-only";
import { all, one } from "./db";
import { COUNTRIES, type RegionId } from "./regions";
import { canViewList } from "./visibility";

export type Film = {
  id: number; slug: string; title: string; original_title: string | null; year: number;
  country: string; director: string; genres: string; motif: string; synopsis: string; kind: "film" | "series";
  seasons: number | null; status: "ended" | "ongoing" | "limited" | null;
  tmdb_id: number | null; imdb_id: string | null; poster_path: string | null; backdrop_path: string | null;
  runtime: number | null; episodes: number | null; cast_names: string;
};
export type FilmWithStats = Film & { avg_rating: number | null; log_count: number; review_count: number };

const FILM_STATS = `
  (SELECT ROUND(AVG(rating), 2) FROM logs WHERE film_id = f.id AND rating IS NOT NULL) AS avg_rating,
  (SELECT COUNT(*) FROM logs WHERE film_id = f.id) AS log_count,
  (SELECT COUNT(*) FROM reviews WHERE film_id = f.id) AS review_count`;

export type FilmFilter = { q?: string; country?: string; region?: RegionId; genre?: string; kind?: "film" | "series"; sort?: "popular" | "rating" | "newest" | "oldest" | "title" };

export function listFilms(f: FilmFilter = {}): FilmWithStats[] {
  const where: string[] = [];
  const params: string[] = [];
  if (f.q) {
    where.push("(f.title LIKE ? OR f.original_title LIKE ? OR f.director LIKE ?)");
    const like = `%${f.q}%`;
    params.push(like, like, like);
  }
  if (f.country) {
    where.push("f.country = ?");
    params.push(f.country);
  } else if (f.region) {
    const codes = COUNTRIES.filter((c) => c.region === f.region).map((c) => c.code);
    where.push(`f.country IN (${codes.map(() => "?").join(",")})`);
    params.push(...codes);
  }
  if (f.kind) {
    where.push("f.kind = ?");
    params.push(f.kind);
  }
  if (f.genre) {
    where.push("(',' || f.genres || ',') LIKE ?");
    params.push(`%,${f.genre},%`);
  }
  const order = {
    popular: "log_count DESC, avg_rating DESC",
    rating: "avg_rating IS NULL, avg_rating DESC",
    newest: "f.year DESC",
    oldest: "f.year ASC",
    title: "f.title COLLATE NOCASE",
  }[f.sort ?? "popular"];
  return all<FilmWithStats>(
    `SELECT f.*, ${FILM_STATS} FROM films f ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order}, f.title`,
    ...params,
  );
}

export function filmBySlug(slug: string): FilmWithStats | undefined {
  return one<FilmWithStats>(`SELECT f.*, ${FILM_STATS} FROM films f WHERE f.slug = ?`, slug);
}

export function filmById(id: number): Film | undefined {
  return one<Film>("SELECT * FROM films WHERE id = ?", id);
}

export function ratingHistogram(filmId: number): number[] {
  const rows = all<{ r: number; n: number }>(
    "SELECT rating r, COUNT(*) n FROM logs WHERE film_id = ? AND rating IS NOT NULL GROUP BY rating",
    filmId,
  );
  const buckets = Array(10).fill(0);
  for (const { r, n } of rows) buckets[Math.round(r * 2) - 1] += n;
  return buckets;
}

export function countryCounts(): Record<string, number> {
  return Object.fromEntries(all<{ country: string; n: number }>("SELECT country, COUNT(*) n FROM films GROUP BY country").map((r) => [r.country, r.n]));
}

// ── Reviews ─────────────────────────────────────────────────────────

export type Review = {
  id: number; user_id: number; film_id: number; rating: number | null; body: string; spoiler: number;
  game_type: string; game_config: string; external_links: string; created_at: string;
  username: string; display_name: string; avatar_item: string; frame_item: string | null; title_item: string | null; namestyle_item: string | null;
  film_slug: string; film_title: string; film_year: number; film_country: string; film_motif: string; film_poster: string | null;
  like_count: number; comment_count: number; liked: number;
  film_kind: string; sticker_summary: string | null; my_sticker: string | null;
};

const REVIEW_SELECT = `
  SELECT r.*, u.username, u.display_name, u.avatar_item, u.frame_item, u.title_item, u.namestyle_item,
    f.slug film_slug, f.title film_title, f.year film_year, f.country film_country, f.motif film_motif, f.kind film_kind, f.poster_path film_poster,
    (SELECT GROUP_CONCAT(sticker_id || ':' || c) FROM (SELECT sticker_id, COUNT(*) c FROM review_stickers WHERE review_id = r.id GROUP BY sticker_id ORDER BY c DESC LIMIT 6)) sticker_summary,
    (SELECT sticker_id FROM review_stickers WHERE review_id = r.id AND user_id = ?1) my_sticker,
    (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) like_count,
    (SELECT COUNT(*) FROM comments WHERE review_id = r.id) comment_count,
    EXISTS(SELECT 1 FROM review_likes WHERE review_id = r.id AND user_id = ?1) liked
  FROM reviews r JOIN users u ON u.id = r.user_id JOIN films f ON f.id = r.film_id`;

export function reviewsForFilm(filmId: number, viewerId = 0): Review[] {
  return all<Review>(`${REVIEW_SELECT} WHERE r.film_id = ? ORDER BY like_count DESC, r.created_at DESC`, viewerId, filmId);
}

export function recentReviews(limit = 10, viewerId = 0): Review[] {
  return all<Review>(`${REVIEW_SELECT} ORDER BY r.created_at DESC LIMIT ?`, viewerId, limit);
}

export function popularReviews(limit = 6, viewerId = 0): Review[] {
  return all<Review>(`${REVIEW_SELECT} ORDER BY like_count DESC, r.created_at DESC LIMIT ?`, viewerId, limit);
}

export function reviewsByUser(userId: number, viewerId = 0): Review[] {
  return all<Review>(`${REVIEW_SELECT} WHERE r.user_id = ? ORDER BY r.created_at DESC`, viewerId, userId);
}

export function feedReviews(viewerId: number, limit = 10): Review[] {
  return all<Review>(
    `${REVIEW_SELECT} WHERE r.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?) ORDER BY r.created_at DESC LIMIT ?`,
    viewerId, viewerId, limit,
  );
}

export function reviewById(id: number, viewerId = 0): Review | undefined {
  return one<Review>(`${REVIEW_SELECT} WHERE r.id = ?`, viewerId, id);
}

export type Comment = { id: number; body: string; created_at: string; user_id: number; username: string; display_name: string; avatar_item: string; frame_item: string | null; namestyle_item: string | null };

export function commentsFor(reviewId: number): Comment[] {
  return all<Comment>(
    `SELECT c.id, c.body, c.created_at, c.user_id, u.username, u.display_name, u.avatar_item, u.frame_item, u.namestyle_item
     FROM comments c JOIN users u ON u.id = c.user_id WHERE c.review_id = ? ORDER BY c.created_at`,
    reviewId,
  );
}

// ── Diary, lists, profile ───────────────────────────────────────────

export type LogEntry = {
  id: number; watched_on: string; rating: number | null; liked: number; rewatch: number; cinema_chain: string | null;
  film_id: number; slug: string; title: string; year: number; country: string; motif: string; review_id: number | null;
};

export function diary(userId: number, limit = 200): LogEntry[] {
  return all<LogEntry>(
    `SELECT l.id, l.watched_on, l.rating, l.liked, l.rewatch, l.cinema_chain, f.id film_id, f.slug, f.title, f.year, f.country, f.motif, f.poster_path,
       (SELECT r.id FROM reviews r WHERE r.user_id = l.user_id AND r.film_id = l.film_id ORDER BY r.created_at DESC LIMIT 1) review_id
     FROM logs l JOIN films f ON f.id = l.film_id WHERE l.user_id = ? ORDER BY l.watched_on DESC, l.id DESC LIMIT ?`,
    userId, limit,
  );
}

export function favorites(userId: number): Film[] {
  return all<Film>("SELECT f.* FROM favorites fv JOIN films f ON f.id = fv.film_id WHERE fv.user_id = ? ORDER BY fv.position", userId);
}

export function watchlist(userId: number): Film[] {
  return all<Film>("SELECT f.* FROM watchlist w JOIN films f ON f.id = w.film_id WHERE w.user_id = ? ORDER BY w.added_at DESC", userId);
}

export type Visibility = "public" | "unlisted" | "private";

export type ListSummary = {
  id: number; title: string; description: string; ranked: number; created_at: string; updated_at: string | null; user_id: number;
  username: string; display_name: string; avatar_item: string; frame_item: string | null; namestyle_item: string | null;
  item_count: number; preview: string; visibility: Visibility; share_token: string; collaborative: number; save_count: number;
};

const LIST_SELECT = `
  SELECT l.*, u.username, u.display_name, u.avatar_item, u.frame_item, u.namestyle_item,
    (SELECT COUNT(*) FROM list_items WHERE list_id = l.id) item_count,
    (SELECT COUNT(*) FROM list_saves WHERE list_id = l.id) save_count,
    (SELECT GROUP_CONCAT(slug, ',') FROM (SELECT f.slug FROM list_items i JOIN films f ON f.id = i.film_id WHERE i.list_id = l.id ORDER BY i.position LIMIT 5)) preview
  FROM lists l JOIN users u ON u.id = l.user_id`;

/** A member's catalogues. Others only see public ones; you also see ones you collaborate on. */
export function listsByUser(userId: number, viewerId = 0): ListSummary[] {
  if (userId === viewerId) {
    return all<ListSummary>(
      `${LIST_SELECT} WHERE l.user_id = ? OR l.id IN (SELECT list_id FROM list_collaborators WHERE user_id = ?) ORDER BY COALESCE(l.updated_at, l.created_at) DESC`,
      userId, userId,
    );
  }
  return all<ListSummary>(`${LIST_SELECT} WHERE l.user_id = ? AND l.visibility = 'public' ORDER BY l.created_at DESC`, userId);
}

export function recentLists(limit = 6): ListSummary[] {
  return all<ListSummary>(`${LIST_SELECT} WHERE l.visibility = 'public' ORDER BY save_count DESC, item_count DESC, l.created_at DESC LIMIT ?`, limit);
}

export function listsContainingFilm(filmId: number): ListSummary[] {
  return all<ListSummary>(
    `${LIST_SELECT} WHERE l.visibility = 'public' AND l.id IN (SELECT list_id FROM list_items WHERE film_id = ?) ORDER BY save_count DESC, item_count DESC LIMIT 4`,
    filmId,
  );
}

export function listById(id: number): ListSummary | undefined {
  return one<ListSummary>(`${LIST_SELECT} WHERE l.id = ?`, id);
}

export function listByToken(token: string): ListSummary | undefined {
  return one<ListSummary>(`${LIST_SELECT} WHERE l.share_token = ?`, token);
}

export function savedLists(userId: number, viewerId = 0): ListSummary[] {
  return all<ListSummary>(
    `${LIST_SELECT} JOIN list_saves s ON s.list_id = l.id WHERE s.user_id = ? AND (l.visibility != 'private' OR l.user_id = ?) ORDER BY s.saved_at DESC`,
    userId, viewerId,
  ).filter((l) => l.visibility === "public" || userId === viewerId);
}

export function listCollaborators(listId: number): { id: number; username: string; display_name: string; avatar_item: string; frame_item: string | null }[] {
  return all("SELECT u.id, u.username, u.display_name, u.avatar_item, u.frame_item FROM list_collaborators c JOIN users u ON u.id = c.user_id WHERE c.list_id = ? ORDER BY c.added_at", listId);
}

export function isCollaborator(listId: number, userId: number): boolean {
  return !!one("SELECT 1 x FROM list_collaborators WHERE list_id = ? AND user_id = ?", listId, userId);
}

export function hasSavedList(listId: number, userId: number): boolean {
  return !!one("SELECT 1 x FROM list_saves WHERE list_id = ? AND user_id = ?", listId, userId);
}

/** Who may see / edit a catalogue. Unlisted needs the share link (token); private is owner + collaborators. */
export function listAccess(l: ListSummary, viewerId: number | undefined, viaToken: boolean): { view: boolean; edit: boolean; own: boolean } {
  const own = !!viewerId && viewerId === l.user_id;
  const collab = !!viewerId && !own && l.collaborative === 1 && isCollaborator(l.id, viewerId);
  const view = canViewList({ visibility: l.visibility, isOwner: own, isCollaborator: collab, viaShareLink: viaToken });
  return { view, edit: own || collab, own };
}

export type ListItem = Film & { position: number; note: string; added_by_name: string | null; avg_rating: number | null };
export function listItems(listId: number): ListItem[] {
  return all(
    `SELECT f.*, i.position, i.note, u.display_name added_by_name,
       (SELECT ROUND(AVG(rating), 1) FROM logs WHERE film_id = f.id AND rating IS NOT NULL) avg_rating
     FROM list_items i JOIN films f ON f.id = i.film_id LEFT JOIN users u ON u.id = i.added_by
     WHERE i.list_id = ? ORDER BY i.position`,
    listId,
  );
}

export function viewerFilmState(userId: number, filmId: number) {
  const last = one<{ rating: number | null; watched_on: string }>(
    "SELECT rating, watched_on FROM logs WHERE user_id = ? AND film_id = ? ORDER BY watched_on DESC, id DESC LIMIT 1",
    userId, filmId,
  );
  const n = (sql: string) => (one<{ n: number }>(sql, userId, filmId)?.n ?? 0);
  return {
    logged: !!last,
    lastRating: last?.rating ?? null,
    lastWatched: last?.watched_on ?? null,
    timesLogged: n("SELECT COUNT(*) n FROM logs WHERE user_id = ? AND film_id = ?"),
    inWatchlist: n("SELECT COUNT(*) n FROM watchlist WHERE user_id = ? AND film_id = ?") > 0,
    isFavorite: n("SELECT COUNT(*) n FROM favorites WHERE user_id = ? AND film_id = ?") > 0,
  };
}

export function followCounts(userId: number) {
  return {
    followers: one<{ n: number }>("SELECT COUNT(*) n FROM follows WHERE followee_id = ?", userId)?.n ?? 0,
    following: one<{ n: number }>("SELECT COUNT(*) n FROM follows WHERE follower_id = ?", userId)?.n ?? 0,
  };
}

export function isFollowing(followerId: number, followeeId: number): boolean {
  return !!one("SELECT 1 x FROM follows WHERE follower_id = ? AND followee_id = ?", followerId, followeeId);
}

export function inventory(userId: number): string[] {
  return all<{ item_id: string }>("SELECT item_id FROM inventory WHERE user_id = ?", userId).map((r) => r.item_id);
}

export type LedgerRow = { id: number; delta: number; reason: string; label: string; created_at: string };
export function ledger(userId: number, limit = 30): LedgerRow[] {
  return all<LedgerRow>("SELECT id, delta, reason, label, created_at FROM points_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?", userId, limit);
}

export function lifetimePoints(userId: number): number {
  return one<{ n: number }>("SELECT COALESCE(SUM(delta),0) n FROM points_ledger WHERE user_id = ? AND delta > 0", userId)?.n ?? 0;
}

export type LeaderRow = { id: number; username: string; display_name: string; avatar_item: string; frame_item: string | null; namestyle_item: string | null; home_country: string; earned: number; achievements: number; films: number };
export function leaderboard(limit = 10): LeaderRow[] {
  return all<LeaderRow>(
    `SELECT u.id, u.username, u.display_name, u.avatar_item, u.frame_item, u.namestyle_item, u.home_country,
       (SELECT COALESCE(SUM(delta),0) FROM points_ledger WHERE user_id = u.id AND delta > 0) earned,
       (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) achievements,
       (SELECT COUNT(DISTINCT film_id) FROM logs WHERE user_id = u.id) films
     FROM users u ORDER BY earned DESC LIMIT ?`,
    limit,
  );
}

export function countryBreakdown(userId: number): { country: string; n: number }[] {
  return all("SELECT f.country, COUNT(DISTINCT f.id) n FROM logs l JOIN films f ON f.id = l.film_id WHERE l.user_id = ? GROUP BY f.country ORDER BY n DESC", userId);
}

export type Notification = { id: number; kind: string; icon: string; title: string; body: string };
export function unseenNotifications(userId: number): Notification[] {
  return all<Notification>("SELECT id, kind, icon, title, body FROM notifications WHERE user_id = ? AND seen = 0 ORDER BY id LIMIT 8", userId);
}

export function cinemaLinks(userId: number): { chain_id: string; member_ref: string; linked_at: string }[] {
  return all("SELECT chain_id, member_ref, linked_at FROM cinema_links WHERE user_id = ?", userId);
}

export type Purchase = { id: number; chain_id: string; ticket_ref: string; amount: number; currency: string; points: number; local_bonus: number; source: string; created_at: string; title: string | null; slug: string | null };
export function purchases(userId: number): Purchase[] {
  return all<Purchase>(
    "SELECT p.*, f.title, f.slug FROM cinema_purchases p LEFT JOIN films f ON f.id = p.film_id WHERE p.user_id = ? ORDER BY p.id DESC LIMIT 20",
    userId,
  );
}

export function gamePlay(userId: number, reviewId: number): { won: number; score: number } | undefined {
  return one("SELECT won, score FROM game_plays WHERE user_id = ? AND review_id = ?", userId, reviewId);
}

export function gameStats(reviewId: number): { plays: number; wins: number } {
  return one("SELECT COUNT(*) plays, COALESCE(SUM(won),0) wins FROM game_plays WHERE review_id = ?", reviewId) ?? { plays: 0, wins: 0 };
}

export function parseStickers(summary: string | null): { id: string; count: number }[] {
  if (!summary) return [];
  return summary.split(",").map((p) => {
    const [id, c] = p.split(":");
    return { id, count: Number(c) };
  });
}

export function eventClaims(userId: number, eventId: string, occurrence: string): string[] {
  return all<{ item_id: string }>(
    "SELECT item_id FROM event_claims WHERE user_id = ? AND event_id = ? AND occurrence = ?",
    userId, eventId, occurrence,
  ).map((r) => r.item_id);
}

export function eventClaimCount(eventId: string, occurrence: string): number {
  return one<{ n: number }>("SELECT COUNT(DISTINCT user_id) n FROM event_claims WHERE event_id = ? AND occurrence = ?", eventId, occurrence)?.n ?? 0;
}

export function filmsBySlugs(slugs: string[]): Film[] {
  if (!slugs.length) return [];
  const rows = all<Film>(`SELECT * FROM films WHERE slug IN (${slugs.map(() => "?").join(",")})`, ...slugs);
  return slugs.map((s) => rows.find((r) => r.slug === s)).filter((f): f is Film => !!f);
}
