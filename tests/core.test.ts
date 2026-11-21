import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { identifyPlatform, platformLinksFor, justWatchLink } from "../src/lib/regions.ts";
import {
  makeTicketCode, parseTicketCode, pointsForPurchase, signWebhook, verifyWebhook, MAX_POINTS_PER_TICKET,
} from "../src/lib/cinema.ts";
import { satisfied, ACHIEVEMENTS, type Stats } from "../src/lib/achievements.ts";

test("Korean films link to Korean platforms first, searched by Hangul title", () => {
  const links = platformLinksFor({ title: "Parasite", originalTitle: "기생충", year: 2019, country: "KR" });
  assert.deepEqual(links.slice(0, 3).map((l) => l.id), ["watcha", "naver", "mydramalist"]);
  assert.ok(links.find((l) => l.id === "watcha")!.url.includes(encodeURIComponent("기생충")));
  // global platforms use the English title
  assert.ok(links.find((l) => l.id === "letterboxd")!.url.includes("Parasite"));
  assert.ok(links.every((l, i) => !l.local || i < 3));
});

test("Chinese films link to Douban and Maoyan", () => {
  const ids = platformLinksFor({ title: "Hi, Mom", originalTitle: "你好，李焕英", year: 2021, country: "CN" }).map((l) => l.id);
  assert.ok(ids.indexOf("douban") === 0 && ids.includes("maoyan"));
});

test("identifyPlatform recognises review hosts and rejects non-http URLs", () => {
  assert.equal(identifyPlatform("https://movie.douban.com/subject/1291546/")?.id, "douban");
  assert.equal(identifyPlatform("https://pedia.watcha.com/ko-KR/contents/abc")?.id, "watcha");
  assert.equal(identifyPlatform("https://myblog.example.com/review")?.id, null);
  assert.equal(identifyPlatform("javascript:alert(1)"), null);
  assert.equal(identifyPlatform("not a url"), null);
});

test("JustWatch link is localised to the viewer's country", () => {
  assert.match(justWatchLink("Mai", "VN")!, /justwatch\.com\/vn\//);
  assert.match(justWatchLink("Mai", null)!, /justwatch\.com\/us\//);
});

test("cinema points: promo multiplier, local-film bonus, currency check, cap", () => {
  // Layar Perdana (MY): 1 KP/MYR × 1.5 promo
  assert.deepEqual(pointsForPurchase({ chainId: "LPD", amount: 20, currency: "MYR" }), { points: 30, localBonus: false });
  assert.deepEqual(pointsForPurchase({ chainId: "LPD", amount: 20, currency: "MYR", filmCountry: "MY" }), { points: 60, localBonus: true });
  assert.equal(pointsForPurchase({ chainId: "LPD", amount: 20, currency: "MYR", filmCountry: "KR" }).localBonus, false);
  assert.throws(() => pointsForPurchase({ chainId: "LPD", amount: 20, currency: "USD" }), /MYR/);
  assert.throws(() => pointsForPurchase({ chainId: "LPD", amount: -5, currency: "MYR" }));
  assert.equal(pointsForPurchase({ chainId: "LPD", amount: 1e6, currency: "MYR" }).points, MAX_POINTS_PER_TICKET);
});

test("webhook signatures: valid, tampered, stale", () => {
  const secret = "s3cret";
  const now = 1_800_000_000;
  const body = JSON.stringify({ ticketRef: "A1" });
  const sig = signWebhook(secret, String(now), body);
  assert.deepEqual(verifyWebhook(secret, String(now), sig, body, now), { ok: true });
  assert.equal(verifyWebhook(secret, String(now), sig, body.replace("A1", "A2"), now).ok, false);
  assert.equal(verifyWebhook("other", String(now), sig, body, now).ok, false);
  assert.equal(verifyWebhook(secret, String(now), sig, body, now + 301).ok, false);
  assert.equal(verifyWebhook(secret, null, sig, body, now).ok, false);
});

test("ticket codes round-trip, forgive typos, reject tampering", () => {
  const secret = "s3cret";
  const code = makeTicketCode(secret, "LPD", randomBytes(6));
  assert.match(code, /^LPD-[0-9A-Z]{6}-[0-9A-Z]{2}$/);
  assert.deepEqual(parseTicketCode(secret, code), { chainId: "LPD", code });
  assert.deepEqual(parseTicketCode(secret, ` ${code.toLowerCase()} `), { chainId: "LPD", code });
  // O typed for 0 in the body is forgiven (but the LPD prefix is left alone)
  const withO = code.slice(0, 4) + code.slice(4).replace(/0/g, "O");
  assert.equal(parseTicketCode(secret, withO)?.code, code);
  const tampered = code.slice(0, 4) + (code[4] === "A" ? "B" : "A") + code.slice(5);
  assert.equal(parseTicketCode(secret, tampered), null);
  assert.equal(parseTicketCode("wrong-secret", code), null);
  assert.equal(parseTicketCode(secret, "XXX-123456-AB"), null);
});

const empty: Stats = {
  filmsLogged: 0, countries: 0, seaCountries: 0, byCountry: {}, seaHorror: 0, decades: 0, rewatches: 0, fiveStars: 0,
  midnightLogs: 0, reviews: 0, longestReview: 0, likesReceived: 0, bigLists: 0, cinemaVisits: 0, cinemaChains: 0,
  localCinemaVisits: 0, gamesWon: 0, following: 0, itemsBought: 0, legendaryOwned: 0, eggsFound: 0, loggedSlugs: new Set(),
  regions: 0, seriesLogged: 0, eventsJoined: 0, scoresReported: 0, stickersGiven: 0,
};

test("achievements unlock from stats and never twice", () => {
  assert.deepEqual(satisfied(empty, new Set()), []);
  const s = { ...empty, filmsLogged: 1, byCountry: { KR: 5 }, loggedSlugs: new Set(["ola-bola-2016"]), midnightLogs: 1 };
  const ids = satisfied(s, new Set()).map((a) => a.id).sort();
  assert.deepEqual(ids, ["first_kisah", "gol", "hallyu", "pontianak_hours"]);
  assert.deepEqual(satisfied(s, new Set(ids)), []);
});

test("every achievement reward points to a real item and ids are unique", async () => {
  const { ITEM_BY_ID } = await import("../src/lib/shop.ts");
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const a of ACHIEVEMENTS) if (a.reward) assert.ok(ITEM_BY_ID[a.reward], `${a.id} → ${a.reward}`);
});

// ── v2: events, rewind, scores ──────────────────────────────────────
import { activeEvents, activeOccurrence, allEvents, bonusesFor, eventById, nextOccurrence, nextOfferFor, offerFor, occurrenceIn, parsePreviewDate } from "../src/lib/events.ts";
import { longestStreak, pickArchetype } from "../src/lib/rewind-core.ts";
import { normaliseScore, scoringPlatformsFor, identifyPlatform as idp } from "../src/lib/regions.ts";
import { parseOmdb, parseTmdb } from "../scripts/score-sources.mjs";

test("Space Opera Day is live on May 4–5 only, with a sci-fi bonus", () => {
  const e = eventById("space-opera-day")!;
  assert.deepEqual(occurrenceIn(e, 2027), { start: "2027-05-04", end: "2027-05-05" });
  assert.ok(activeOccurrence(e, "2027-05-04"));
  assert.ok(activeOccurrence(e, "2027-05-05"));
  assert.equal(activeOccurrence(e, "2027-05-06"), null);
  const ids = activeEvents("2027-05-04").map((x) => x.id);
  assert.ok(ids.includes("space-opera-day"));
  assert.ok(bonusesFor({ slug: "star-wars-1977", country: "US", genres: "Sci-Fi,Action" }, "2027-05-04").some((x) => x.id === "space-opera-day"));
  assert.ok(!bonusesFor({ slug: "ola-bola-2016", country: "MY", genres: "Sports" }, "2027-05-04").some((x) => x.id === "space-opera-day"));
});

test("events that wrap the new year (Rewind season) and lunar-dated events", () => {
  const rewind = eventById("rewind-season")!;
  assert.ok(activeOccurrence(rewind, "2027-01-10"), "Jan 10 is inside the Dec–Jan window");
  assert.equal(activeOccurrence(rewind, "2027-01-16"), null);
  const lny = eventById("lunar-new-year")!;
  assert.deepEqual(occurrenceIn(lny, 2027), { start: "2027-02-06", end: "2027-02-20" });
  assert.equal(nextOccurrence(lny, "2027-03-01")?.start, "2028-01-26");
});

test("limited items are only offered while their event is live", () => {
  assert.equal(offerFor("st_rocket", "2027-05-04")?.price, 0);
  assert.equal(offerFor("st_rocket", "2027-06-01"), null);
  assert.equal(nextOfferFor("st_rocket", "2027-06-01")?.start, "2028-05-04");
});

test("every event offer and featured title points to something real", async () => {
  const { ITEM_BY_ID } = await import("../src/lib/shop.ts");
  const { CATALOG } = await import("../src/lib/catalog.ts");
  const slugs = new Set(CATALOG.map((f) => f.slug));
  const ids = new Set<string>();
  for (const e of allEvents()) {
    assert.ok(!ids.has(e.id), `duplicate event ${e.id}`);
    ids.add(e.id);
    for (const o of e.offers) assert.ok(ITEM_BY_ID[o.item], `${e.id} offers unknown ${o.item}`);
    for (const f of e.featured) assert.ok(slugs.has(f), `${e.id} features unknown ${f}`);
  }
  // every event-exclusive item is offered by its event
  for (const item of Object.values(ITEM_BY_ID)) {
    if (item.event) assert.ok(eventById(item.event)?.offers.some((o) => o.item === item.id), `${item.id} not offered by ${item.event}`);
  }
});

test("catalogue slugs are unique and series are marked", async () => {
  const { CATALOG } = await import("../src/lib/catalog.ts");
  assert.equal(new Set(CATALOG.map((f) => f.slug)).size, CATALOG.length);
  assert.ok(CATALOG.filter((f) => f.kind === "series").length >= 10);
});

test("preview dates are validated", () => {
  assert.equal(parsePreviewDate("2026-05-04"), "2026-05-04");
  assert.equal(parsePreviewDate("2026-02-30"), null);
  assert.equal(parsePreviewDate("<script>"), null);
});

test("rewind: streaks and archetypes", () => {
  assert.equal(longestStreak(["2026-01-01", "2026-01-02", "2026-01-02", "2026-01-03", "2026-01-10"]), 3);
  assert.equal(longestStreak([]), 0);
  const base = { total: 10, horror: 0, series: 0, korean: 0, sea: 0, countries: 2, regions: 1, cinema: 0, reviews: 0, midnight: 0, avgRating: 3.5 };
  assert.equal(pickArchetype({ ...base, horror: 4 }).id, "hantu");
  assert.equal(pickArchetype({ ...base, series: 6 }).id, "binge");
  assert.equal(pickArchetype({ ...base, regions: 4 }).id, "globe");
  assert.equal(pickArchetype({ ...base, sea: 7 }).id, "local");
  assert.equal(pickArchetype({ ...base }).id, "wanderer");
  assert.equal(pickArchetype({ ...base, total: 0 }).id, "blank");
});

test("scores: normalisation, relevant platforms, parsers", () => {
  assert.equal(normaliseScore(8.5, 10), 85);
  assert.equal(normaliseScore(4, 5), 80);
  assert.equal(normaliseScore(120, 100), 100);
  assert.deepEqual(scoringPlatformsFor("KR").map((p) => p.id).slice(0, 3), ["watcha", "naver", "mydramalist"]);
  assert.ok(scoringPlatformsFor("FR").some((p) => p.id === "allocine"));
  assert.ok(!scoringPlatformsFor("MY").some((p) => p.id.startsWith("wiki")), "wikis have no scores");
  assert.equal(idp("https://www.allocine.fr/film/fichefilm_gen_cfilm=1.html")?.id, "allocine");
  assert.deepEqual(
    parseOmdb({ Response: "True", imdbRating: "8.5", imdbVotes: "1,234", imdbID: "tt1", Ratings: [{ Source: "Rotten Tomatoes", Value: "99%" }, { Source: "Metacritic", Value: "96/100" }] }),
    [
      { platform: "imdb", value: 8.5, votes: 1234, url: "https://www.imdb.com/title/tt1/" },
      { platform: "rottentomatoes", value: 99, votes: null, url: null },
      { platform: "metacritic", value: 96, votes: null, url: null },
    ],
  );
  assert.deepEqual(parseOmdb({ Response: "False" }), []);
  assert.deepEqual(parseTmdb({ results: [{ id: 7, vote_average: 8.46, vote_count: 99 }] }, "series"), [{ platform: "tmdb", value: 8.5, votes: 99, url: "https://www.themoviedb.org/tv/7" }]);
  assert.deepEqual(parseTmdb({ results: [] }, "film"), []);
});
