"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireUser, userByUsername, currentUser } from "@/lib/auth";
import { all, one, run, tx } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { award, checkAchievements, grantItem, notify, POINTS, unlock } from "@/lib/rewards";
import { ITEM_BY_ID, STARTER_ITEMS } from "@/lib/shop";
import { EGG_IDS } from "@/lib/achievements";
import { configFromForm, judge, type Verdict } from "@/lib/games";
import { filmById, reviewById } from "@/lib/queries";
import { COUNTRY_BY_CODE, identifyPlatform } from "@/lib/regions";
import { CHAIN_BY_ID, makeTicketCode, webhookSecret } from "@/lib/cinema";
import { redeemTicketCode } from "@/lib/purchases";
import { reportScore } from "@/lib/scores";
import { bonusesFor, eventById, activeOccurrence, today } from "@/lib/events";

export type FormState = { error?: string; ok?: string } | undefined;

/** Points changed: refresh every layout so the header balance and toasts update. */
const refresh = () => revalidatePath("/", "layout");

const str = (form: FormData, key: string, max = 5000) => String(form.get(key) ?? "").trim().slice(0, max);

function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
}

// ── Auth ─────────────────────────────────────────────────────────────

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const username = str(form, "username", 40).toLowerCase();
  const displayName = str(form, "display_name", 60) || username;
  const password = String(form.get("password") ?? "");
  const homeCountry = str(form, "home_country", 2).toUpperCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "Username: 3–20 letters, numbers or underscores." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!COUNTRY_BY_CODE[homeCountry]) return { error: "Pick your home country." };
  if (userByUsername(username)) return { error: "That username is taken. Cuba lagi!" };

  const id = tx(() => {
    const r = run(
      "INSERT INTO users (username, display_name, password_hash, home_country) VALUES (?,?,?,?)",
      username, displayName, hashPassword(password), homeCountry,
    );
    const uid = Number(r.lastInsertRowid);
    for (const it of STARTER_ITEMS) grantItem(uid, it, "starter");
    award(uid, POINTS.welcome, "welcome", "welcome", "Selamat datang! Welcome bonus", { silent: true });
    notify(uid, "welcome", "🎉", "Selamat datang ke KisahKisah!", `Here's ${POINTS.welcome} KP to spend in the Kedai.`);
    return uid;
  });
  await createSession(id);
  redirect(safeNext(str(form, "next")) === "/" ? "/films" : safeNext(str(form, "next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const username = str(form, "username", 40);
  const password = String(form.get("password") ?? "");
  const row = one<{ id: number; password_hash: string }>("SELECT id, password_hash FROM users WHERE username = ?", username);
  if (!row || !verifyPassword(password, row.password_hash)) return { error: "Wrong username or password." };
  await createSession(row.id);
  redirect(safeNext(str(form, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ── Diary & reviews ──────────────────────────────────────────────────

function parseLinks(raw: string): string[] {
  return raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s && identifyPlatform(s))
    .slice(0, 5);
}

export async function logFilm(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const film = filmById(Number(form.get("film_id")));
  if (!film) return { error: "Film not found." };

  const watchedOn = /^\d{4}-\d{2}-\d{2}$/.test(str(form, "watched_on")) ? str(form, "watched_on") : new Date().toISOString().slice(0, 10);
  const ratingRaw = Number(form.get("rating"));
  const rating = ratingRaw >= 0.5 && ratingRaw <= 5 ? Math.round(ratingRaw * 2) / 2 : null;
  const liked = form.get("liked") === "on" ? 1 : 0;
  const rewatch = form.get("rewatch") === "on" ? 1 : 0;
  const localHour = Number.isInteger(Number(form.get("local_hour"))) ? Math.max(0, Math.min(23, Number(form.get("local_hour")))) : null;
  const body = str(form, "body", 8000);
  const spoiler = form.get("spoiler") === "on" ? 1 : 0;
  const links = parseLinks(str(form, "links", 2000));

  let game: ReturnType<typeof configFromForm> = { type: "none", config: {} };
  if (body) {
    try {
      game = configFromForm(str(form, "game_type"), form);
    } catch (e) {
      return { error: (e as Error).message };
    }
    if (game.type === "guess_rating" && !rating) return { error: "Teka Bintang needs a star rating to guess!" };
  }

  let reviewId: number | null = null;
  tx(() => {
    run(
      "INSERT INTO logs (user_id, film_id, watched_on, rating, liked, rewatch, local_hour) VALUES (?,?,?,?,?,?,?)",
      user.id, film.id, watchedOn, rating, liked, rewatch, localHour,
    );
    award(user.id, POINTS.log, "log", `film:${film.id}`, `Logged ${film.title}`);
    if (body) {
      const r = run(
        "INSERT INTO reviews (user_id, film_id, rating, body, spoiler, game_type, game_config, external_links) VALUES (?,?,?,?,?,?,?,?)",
        user.id, film.id, rating, body, spoiler, game.type, JSON.stringify(game.config), JSON.stringify(links),
      );
      reviewId = Number(r.lastInsertRowid);
      if (body.length >= 40) award(user.id, POINTS.review, "review", `film:${film.id}`, `Reviewed ${film.title}`);
      if (body.length >= 400) award(user.id, POINTS.longReview, "long_review", `film:${film.id}`, "Long-form bonus");
    }
    for (const e of bonusesFor(film)) {
      const key = `${e.id}@${e.occurrence.start}`;
      const used = one<{ n: number }>("SELECT COUNT(*) n FROM points_ledger WHERE user_id = ? AND reason = 'event' AND ref LIKE ?", user.id, `${key}#%`)?.n ?? 0;
      if (used < e.bonus!.maxLogs) award(user.id, e.bonus!.points, "event", `${key}#film:${film.id}`, `${e.icon} ${e.name} bonus: ${film.title}`);
    }
  });
  checkAchievements(user.id);
  refresh();
  redirect(reviewId ? `/review/${reviewId}` : `/film/${film.slug}?logged=1`);
}

export async function deleteReview(reviewId: number) {
  const user = await requireUser();
  const r = reviewById(reviewId);
  if (!r || r.user_id !== user.id) return;
  run("DELETE FROM reviews WHERE id = ?", reviewId);
  redirect(`/film/${r.film_slug}`);
}

export async function toggleLike(reviewId: number) {
  const user = await requireUser();
  const r = reviewById(reviewId);
  if (!r) return;
  const removed = run("DELETE FROM review_likes WHERE review_id = ? AND user_id = ?", reviewId, user.id).changes > 0;
  if (!removed) {
    run("INSERT INTO review_likes (review_id, user_id) VALUES (?,?)", reviewId, user.id);
    if (r.user_id !== user.id) {
      award(r.user_id, POINTS.likeReceived, "like", `${reviewId}:${user.id}`, `${user.display_name} liked your review of ${r.film_title}`, { silent: true });
      checkAchievements(r.user_id);
    }
  }
  refresh();
}

export async function addComment(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const reviewId = Number(form.get("review_id"));
  const body = str(form, "body", 1500);
  if (!body) return { error: "Say something first!" };
  const r = reviewById(reviewId);
  if (!r) return { error: "Review not found." };
  const c = run("INSERT INTO comments (review_id, user_id, body) VALUES (?,?,?)", reviewId, user.id, body);
  const today = new Date().toISOString().slice(0, 10);
  const todays = one<{ n: number }>("SELECT COUNT(*) n FROM points_ledger WHERE user_id = ? AND reason = 'comment' AND created_at >= ?", user.id, today)?.n ?? 0;
  if (todays < POINTS.commentsPerDay && r.user_id !== user.id) {
    award(user.id, POINTS.comment, "comment", String(c.lastInsertRowid), "Joined the conversation", { silent: true });
  }
  if (r.user_id !== user.id) notify(r.user_id, "comment", "💬", `${user.display_name} commented on your review`, body.slice(0, 80));
  refresh();
  return { ok: "Posted!" };
}

// ── Watchlist, favourites, follows ───────────────────────────────────

export async function toggleWatchlist(filmId: number) {
  const user = await requireUser();
  const f = filmById(filmId);
  if (!f) return;
  if (run("DELETE FROM watchlist WHERE user_id = ? AND film_id = ?", user.id, filmId).changes === 0) {
    run("INSERT INTO watchlist (user_id, film_id) VALUES (?,?)", user.id, filmId);
  }
  revalidatePath(`/film/${f.slug}`);
}

export async function toggleFavorite(filmId: number): Promise<FormState> {
  const user = await requireUser();
  const f = filmById(filmId);
  if (!f) return { error: "Film not found." };
  if (run("DELETE FROM favorites WHERE user_id = ? AND film_id = ?", user.id, filmId).changes === 0) {
    const n = one<{ n: number }>("SELECT COUNT(*) n FROM favorites WHERE user_id = ?", user.id)?.n ?? 0;
    if (n >= 4) return { error: "Your top 4 is full. Remove one from your profile first." };
    run("INSERT INTO favorites (user_id, film_id, position) VALUES (?,?,?)", user.id, filmId, n);
  }
  revalidatePath(`/film/${f.slug}`);
  revalidatePath(`/u/${user.username}`);
  return { ok: "Updated" };
}

export async function toggleFollow(userId: number) {
  const user = await requireUser();
  if (userId === user.id) return;
  const target = one<{ username: string }>("SELECT username FROM users WHERE id = ?", userId);
  if (!target) return;
  if (run("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", user.id, userId).changes === 0) {
    run("INSERT INTO follows (follower_id, followee_id) VALUES (?,?)", user.id, userId);
    notify(userId, "follow", "👋", `${user.display_name} followed you`);
    checkAchievements(user.id);
  }
  refresh();
}

// ── Catalogues (lists) ───────────────────────────────────────────────

export async function createList(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const title = str(form, "title", 120);
  if (!title) return { error: "Give your catalogue a name." };
  const description = str(form, "description", 1000);
  const ranked = form.get("ranked") === "on" ? 1 : 0;
  const filmIds = [...new Set(form.getAll("film").map(Number).filter(Boolean))].slice(0, 100);
  const id = tx(() => {
    const lid = Number(run("INSERT INTO lists (user_id, title, description, ranked) VALUES (?,?,?,?)", user.id, title, description, ranked).lastInsertRowid);
    filmIds.forEach((fid, i) => {
      if (filmById(fid)) run("INSERT OR IGNORE INTO list_items (list_id, film_id, position) VALUES (?,?,?)", lid, fid, i);
    });
    award(user.id, POINTS.list, "list", String(lid), `Created catalogue “${title}”`);
    return lid;
  });
  checkAchievements(user.id);
  redirect(`/lists/${id}`);
}

export async function addToList(listId: number, filmId: number) {
  const user = await requireUser();
  const list = one<{ user_id: number }>("SELECT user_id FROM lists WHERE id = ?", listId);
  if (!list || list.user_id !== user.id || !filmById(filmId)) return;
  const pos = one<{ n: number }>("SELECT COALESCE(MAX(position)+1, 0) n FROM list_items WHERE list_id = ?", listId)?.n ?? 0;
  run("INSERT OR IGNORE INTO list_items (list_id, film_id, position) VALUES (?,?,?)", listId, filmId, pos);
  checkAchievements(user.id);
  refresh();
}

export async function removeFromList(listId: number, filmId: number) {
  const user = await requireUser();
  const list = one<{ user_id: number }>("SELECT user_id FROM lists WHERE id = ?", listId);
  if (!list || list.user_id !== user.id) return;
  run("DELETE FROM list_items WHERE list_id = ? AND film_id = ?", listId, filmId);
  revalidatePath(`/lists/${listId}`);
}

export async function deleteList(listId: number) {
  const user = await requireUser();
  run("DELETE FROM lists WHERE id = ? AND user_id = ?", listId, user.id);
  redirect(`/u/${user.username}/lists`);
}

// ── Profile & shop ───────────────────────────────────────────────────

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const displayName = str(form, "display_name", 60);
  const bio = str(form, "bio", 400);
  const home = str(form, "home_country", 2).toUpperCase();
  if (!displayName) return { error: "Display name can't be empty." };
  if (!COUNTRY_BY_CODE[home]) return { error: "Unknown country." };
  run("UPDATE users SET display_name = ?, bio = ?, home_country = ? WHERE id = ?", displayName, bio, home, user.id);
  revalidatePath(`/u/${user.username}`);
  return { ok: "Profile saved." };
}

export async function buyItem(itemId: string): Promise<FormState> {
  const user = await requireUser();
  const item = ITEM_BY_ID[itemId];
  if (!item || item.price === null) return { error: "That item can't be bought. It has to be earned." };
  const owned = one("SELECT 1 x FROM inventory WHERE user_id = ? AND item_id = ?", user.id, itemId);
  if (owned) return { error: "You already own this." };
  const result = tx((): FormState => {
    const fresh = one<{ points: number }>("SELECT points FROM users WHERE id = ?", user.id)!;
    if (fresh.points < item.price!) return { error: `Not enough KP. You need ${item.price! - fresh.points} more.` };
    award(user.id, -item.price!, "purchase", item.id, `Bought ${item.name}`);
    grantItem(user.id, item.id, "shop");
    return { ok: `${item.name} is yours!` };
  });
  if (result?.ok) checkAchievements(user.id);
  refresh();
  return result;
}

export async function equipItem(itemId: string | null, slot: "avatar" | "frame" | "banner" | "title" | "theme") {
  const user = await requireUser();
  const cols = { avatar: "avatar_item", frame: "frame_item", banner: "banner_item", title: "title_item", theme: "theme_item" } as const;
  if (!Object.hasOwn(cols, slot)) return;
  const col = cols[slot];
  if (itemId === null) {
    if (slot === "avatar") return;
    run(`UPDATE users SET ${col} = NULL WHERE id = ?`, user.id);
  } else {
    const item = ITEM_BY_ID[itemId];
    if (!item || item.type !== slot) return;
    if (!one("SELECT 1 x FROM inventory WHERE user_id = ? AND item_id = ?", user.id, itemId)) return;
    run(`UPDATE users SET ${col} = ? WHERE id = ?`, itemId, user.id);
  }
  revalidatePath("/", "layout");
}

export async function dailyCheckin(): Promise<FormState> {
  const user = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_checkin === today) return { error: "Already checked in today. Come back tomorrow!" };
  run("UPDATE users SET last_checkin = ? WHERE id = ?", today, user.id);
  award(user.id, POINTS.dailyCheckin, "checkin", today, "Daily check-in");
  refresh();
  return { ok: `+${POINTS.dailyCheckin} KP` };
}

export async function markNotificationsSeen(ids: number[]) {
  const user = await currentUser();
  if (!user || ids.length === 0) return;
  const safe = ids.filter(Number.isInteger).slice(0, 50);
  run(`UPDATE notifications SET seen = 1 WHERE user_id = ? AND id IN (${safe.map(() => "?").join(",")})`, user.id, ...safe);
}

// ── Mini games & easter eggs ─────────────────────────────────────────

export async function playGame(reviewId: number, answer: number): Promise<Verdict | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Sign in to play and win KP." };
  const r = reviewById(reviewId);
  if (!r || r.game_type === "none") return { error: "No game here." };
  if (r.user_id === user.id) return { error: "You can't play your own game, lah!" };
  if (one("SELECT 1 x FROM game_plays WHERE user_id = ? AND review_id = ?", user.id, reviewId)) {
    return { error: "You've already played this one." };
  }
  if (!Number.isFinite(answer)) return { error: "Invalid answer." };
  const v = judge(r, answer);
  tx(() => {
    run("INSERT INTO game_plays (user_id, review_id, won, score) VALUES (?,?,?,?)", user.id, reviewId, v.won ? 1 : 0, v.score);
    if (v.points > 0) award(user.id, v.points, "game", String(reviewId), `Mini game on ${r.display_name}'s ${r.film_title} review`, { silent: true });
  });
  checkAchievements(user.id);
  refresh();
  return v;
}

export async function foundEgg(eggId: string): Promise<{ ok: boolean; new?: boolean; signedIn: boolean }> {
  if (!EGG_IDS.has(eggId)) return { ok: false, signedIn: false };
  const user = await currentUser();
  if (!user) return { ok: true, signedIn: false };
  const fresh = unlock(user.id, eggId);
  if (fresh) {
    checkAchievements(user.id);
    refresh();
  }
  return { ok: true, new: fresh, signedIn: true };
}

// ── Cinema ───────────────────────────────────────────────────────────

export async function linkCinema(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const chainId = str(form, "chain", 3).toUpperCase();
  const memberRef = str(form, "member_ref", 40).toUpperCase();
  if (!CHAIN_BY_ID[chainId]) return { error: "Pick a cinema." };
  if (!/^[A-Z0-9-]{4,40}$/.test(memberRef)) return { error: "Membership numbers are 4–40 letters or digits." };
  const taken = one<{ user_id: number }>("SELECT user_id FROM cinema_links WHERE chain_id = ? AND member_ref = ?", chainId, memberRef);
  if (taken && taken.user_id !== user.id) return { error: "That membership is linked to another account." };
  run(
    "INSERT INTO cinema_links (user_id, chain_id, member_ref) VALUES (?,?,?) ON CONFLICT(user_id, chain_id) DO UPDATE SET member_ref = excluded.member_ref",
    user.id, chainId, memberRef,
  );
  revalidatePath("/cinemas");
  return { ok: `Linked to ${CHAIN_BY_ID[chainId].name}. Future purchases earn KP automatically.` };
}

export async function unlinkCinema(chainId: string) {
  const user = await requireUser();
  run("DELETE FROM cinema_links WHERE user_id = ? AND chain_id = ?", user.id, chainId);
  revalidatePath("/cinemas");
}

export async function redeemTicket(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const res = redeemTicketCode(user.id, str(form, "code", 40));
  refresh();
  if (!res.ok) return { error: res.error };
  if (res.duplicate) return { error: "You've already claimed this ticket." };
  return { ok: `+${res.points} KP${res.localBonus ? " (local film bonus ×2!)" : ""}` };
}

/**
 * DEMO ONLY: plays the role of the cinema's box office and issues a ticket
 * with a valid code, so the redeem flow can be tried end to end.
 */
export async function demoIssueTicket(_: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  if (process.env.DISABLE_DEMO_CINEMA === "1") return { error: "Demo box office is disabled." };
  const chainId = str(form, "chain", 3).toUpperCase();
  const chain = CHAIN_BY_ID[chainId];
  if (!chain) return { error: "Pick a cinema." };
  const film = filmById(Number(form.get("film_id")));
  const amount = Number(form.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a ticket price." };
  const currency = COUNTRY_BY_CODE[chain.country].currency;
  const code = makeTicketCode(webhookSecret(), chain.id, randomBytes(6));
  run("INSERT INTO cinema_tickets (code, chain_id, film_id, amount, currency) VALUES (?,?,?,?,?)", code, chain.id, film?.id ?? null, amount, currency);
  return { ok: code };
}

// Used by the list picker on film pages
export async function myLists(): Promise<{ id: number; title: string }[]> {
  const user = await currentUser();
  if (!user) return [];
  return all("SELECT id, title FROM lists WHERE user_id = ? ORDER BY created_at DESC", user.id);
}

export async function addToListForm(form: FormData) {
  await addToList(Number(form.get("list_id")), Number(form.get("film_id")));
}

// ── Stickers ─────────────────────────────────────────────────────────

export async function stickReview(reviewId: number, stickerId: string) {
  const user = await requireUser();
  const r = reviewById(reviewId);
  const item = ITEM_BY_ID[stickerId];
  if (!r || !item || item.type !== "sticker") return;
  if (!one("SELECT 1 x FROM inventory WHERE user_id = ? AND item_id = ?", user.id, stickerId)) return;
  const current = one<{ sticker_id: string }>("SELECT sticker_id FROM review_stickers WHERE review_id = ? AND user_id = ?", reviewId, user.id);
  if (current?.sticker_id === stickerId) {
    run("DELETE FROM review_stickers WHERE review_id = ? AND user_id = ?", reviewId, user.id);
  } else {
    run(
      "INSERT INTO review_stickers (review_id, user_id, sticker_id) VALUES (?,?,?) ON CONFLICT(review_id, user_id) DO UPDATE SET sticker_id = excluded.sticker_id",
      reviewId, user.id, stickerId,
    );
    if (!current && r.user_id !== user.id) notify(r.user_id, "sticker", "🏷️", `${user.display_name} stuck a sticker on your review`, `${item.name} on ${r.film_title}`);
    checkAchievements(user.id);
  }
  refresh();
}

// ── Scores around the world ─────────────────────────────────────────

export async function reportScoreAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const filmId = Number(form.get("film_id"));
  const platformId = str(form, "platform", 40);
  const res = reportScore(user.id, filmId, platformId, Number(form.get("value")), str(form, "url", 500));
  if (!res.ok) return { error: res.error };
  award(user.id, 2, "score_report", `${filmId}:${platformId}`, "Reported a score from another platform", { silent: true });
  checkAchievements(user.id);
  refresh();
  return { ok: "Thanks! Your report is in." };
}

// ── Events ───────────────────────────────────────────────────────────

export async function claimEventItem(eventId: string, itemId: string): Promise<FormState> {
  const user = await requireUser();
  const e = eventById(eventId);
  const item = ITEM_BY_ID[itemId];
  if (!e || !item) return { error: "Unknown item." };
  const occ = activeOccurrence(e, today());
  if (!occ) return { error: `${e.name} isn't running right now. This item is vaulted until it returns.` };
  const offer = e.offers.find((o) => o.item === itemId);
  if (!offer) return { error: "That item isn't part of this event." };
  if (one("SELECT 1 x FROM inventory WHERE user_id = ? AND item_id = ?", user.id, itemId)) return { error: "You already have this one." };
  const res = tx((): FormState => {
    if (offer.price > 0) {
      const fresh = one<{ points: number }>("SELECT points FROM users WHERE id = ?", user.id)!;
      if (fresh.points < offer.price) return { error: `Not enough KP. You need ${offer.price - fresh.points} more.` };
      award(user.id, -offer.price, "purchase", `${eventId}@${occ.start}:${itemId}`, `${e.name}: ${item.name}`);
    }
    grantItem(user.id, itemId, `event:${eventId}`);
    run("INSERT OR IGNORE INTO event_claims (user_id, event_id, occurrence, item_id, price) VALUES (?,?,?,?,?)", user.id, eventId, occ.start, itemId, offer.price);
    return { ok: `${item.name} added to your inventory!` };
  });
  if (res?.ok) checkAchievements(user.id);
  refresh();
  return res;
}

// ── Rewind ───────────────────────────────────────────────────────────

export async function viewedRewind() {
  const user = await currentUser();
  if (!user) return;
  if (unlock(user.id, "rewound")) refresh();
}

// ── Advertising inquiries ───────────────────────────────────────────

export async function submitAdInquiry(_: FormState, form: FormData): Promise<FormState> {
  const company = str(form, "company", 120);
  const name = str(form, "contact_name", 120);
  const email = str(form, "email", 200);
  const title = str(form, "title", 200);
  const pkg = str(form, "package", 40);
  const markets = form.getAll("markets").map(String).filter((m) => COUNTRY_BY_CODE[m] || m === "GLOBAL").slice(0, 40);
  if (!company || !name || !title) return { error: "Company, your name and the title you're promoting are required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Please enter a valid email." };
  if (!markets.length) return { error: "Pick at least one market." };
  run(
    "INSERT INTO ad_inquiries (company, contact_name, email, title, release_date, markets, package, message) VALUES (?,?,?,?,?,?,?,?)",
    company, name, email, title, str(form, "release_date", 10) || null, markets.join(","), pkg || "unsure", str(form, "message", 3000),
  );
  return { ok: "Terima kasih! Our partnerships team will reply within two working days." };
}
