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
  regions: 0, seriesLogged: 0, eventsJoined: 0, scoresReported: 0, stickersGiven: 0, franchisesCompleted: 0, listSaves: 0,
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

// ── v3: levels, bundles, cosmetics integrity ───────────────────────
import { levelFromXp, levelStyle, xpForLevel } from "../src/lib/levels.ts";

test("levels: XP per level grows each decade, shapes change every 10 levels", () => {
  assert.equal(xpForLevel(0), 100);
  assert.equal(xpForLevel(10), 200);
  assert.deepEqual(levelFromXp(0), { level: 0, into: 0, need: 100, pct: 0 });
  assert.equal(levelFromXp(1000).level, 10);
  assert.equal(levelFromXp(1199).level, 10);
  assert.equal(levelFromXp(1200).level, 11);
  assert.equal(levelStyle(5).shape, "circle");
  assert.equal(levelStyle(15).shape, "hexagon");
  assert.equal(levelStyle(99).shape, "star");
});

test("bundles: cheaper than buying separately, price shrinks with what you own", async () => {
  const { BUNDLES, ITEM_BY_ID, bundlePrice } = await import("../src/lib/shop.ts");
  for (const b of BUNDLES) {
    const total = b.items.reduce((a, id) => a + (ITEM_BY_ID[id]?.price ?? 0), 0);
    for (const id of b.items) assert.ok(ITEM_BY_ID[id]?.price, `${b.id}: ${id} must be a purchasable item`);
    assert.ok(b.price < total, `${b.id} should be a discount`);
    assert.equal(bundlePrice(b, new Set()), b.price);
    assert.equal(bundlePrice(b, new Set(b.items)), 0);
    assert.ok(bundlePrice(b, new Set([b.items[0]])) < b.price);
  }
});

test("cosmetics: effects have particles, stickers animate, decorations are frames", async () => {
  const { ITEMS } = await import("../src/lib/shop.ts");
  for (const i of ITEMS) {
    if (i.type === "effect") assert.ok(i.particles?.length && i.motion, `${i.id} needs particles + motion`);
    if (i.type === "sticker") assert.ok(i.anim, `${i.id} needs an animation`);
    if (i.type === "namestyle") assert.match(i.value, /^ns-/);
  }
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, "item ids unique");
});

// ── v4: collections, sharing ───────────────────────────────────────
import { FRANCHISES, completedFranchises, franchisesFor, positionIn } from "../src/lib/franchises.ts";
import { canViewList } from "../src/lib/visibility.ts";

test("collections point at real catalogue titles, with valid story orders", async () => {
  const { CATALOG } = await import("../src/lib/catalog.ts");
  const slugs = new Set(CATALOG.map((f) => f.slug));
  assert.equal(new Set(FRANCHISES.map((f) => f.id)).size, FRANCHISES.length);
  for (const f of FRANCHISES) {
    assert.ok(f.entries.length >= 2, `${f.id} needs 2+ entries`);
    for (const e of f.entries) assert.ok(slugs.has(e.slug), `${f.id}: unknown ${e.slug}`);
    if (f.storyOrder) assert.deepEqual([...f.storyOrder].sort(), f.entries.map((e) => e.slug).sort(), `${f.id} story order must be a permutation`);
  }
  assert.deepEqual(positionIn(franchisesFor("oldboy-2003")[0], "oldboy-2003"), { index: 2, total: 3 });
  assert.equal(completedFranchises(new Set(["the-raid-2011", "the-raid-2-2014"]))[0]?.id, "the-raid");
  assert.equal(completedFranchises(new Set(["the-raid-2011"])).length, 0);
});

test("catalogue visibility works like playlists", () => {
  const base = { isOwner: false, isCollaborator: false, viaShareLink: false };
  assert.equal(canViewList({ ...base, visibility: "public" }), true);
  assert.equal(canViewList({ ...base, visibility: "unlisted" }), false);
  assert.equal(canViewList({ ...base, visibility: "unlisted", viaShareLink: true }), true);
  assert.equal(canViewList({ ...base, visibility: "private", viaShareLink: true }), false);
  assert.equal(canViewList({ ...base, visibility: "private", isCollaborator: true }), true);
  assert.equal(canViewList({ ...base, visibility: "private", isOwner: true }), true);
});

// ── v5: uploads, checks, custom items ──────────────────────────────
import { contrast, validateAsset, validateGradient, validateTheme } from "../src/lib/asset-spec.ts";
import { readiness, toShopItem } from "../src/lib/custom-item-map.ts";

test("asset checks: stickers, decorations, banners", () => {
  const good = { format: "png", width: 512, height: 512, bytes: 120_000, hasAlpha: true, frames: 1 };
  assert.equal(validateAsset("sticker", good).ok, true);
  assert.equal(validateAsset("sticker", { ...good, hasAlpha: false }).ok, false, "stickers need transparency");
  assert.equal(validateAsset("sticker", { ...good, width: 600 }).ok, false, "must be square");
  assert.equal(validateAsset("sticker", { ...good, bytes: 900_000 }).ok, false, "too big");
  assert.equal(validateAsset("sticker", { ...good, format: "svg" }).ok, false, "svg not accepted");
  const deco = { ...good, width: 640, height: 640 };
  assert.equal(validateAsset("frame", { ...deco, holeAlphaMax: 0 }).ok, true);
  assert.equal(validateAsset("frame", { ...deco, holeAlphaMax: 255 }).ok, false, "avatar hole must be clear");
  assert.equal(validateAsset("banner", { format: "jpeg", width: 1500, height: 500, bytes: 400_000, hasAlpha: false, frames: 1 }).ok, true);
  assert.equal(validateAsset("banner", { format: "jpeg", width: 1500, height: 900, bytes: 400_000, hasAlpha: false, frames: 1 }).ok, false);
  const fx = validateAsset("effect", { format: "webp", width: 1000, height: 1200, bytes: 800_000, hasAlpha: true, frames: 1 });
  assert.equal(fx.ok, true, "a static effect is only a warning");
  assert.ok(fx.checks.some((c) => c.level === "warning" && !c.pass));
});

test("colour checks: contrast, themes, gradients", () => {
  assert.equal(contrast("#000000", "#ffffff"), 21);
  assert.equal(contrast("#ffffff", "#ffffff"), 1);
  const ok = { ink: "#0e1014", surface: "#171a21", raised: "#1f232c", line: "#2a2f3a", text: "#ece8e1", muted: "#9aa1ad", saffron: "#f5a524", jade: "#19b38a", lotus: "#ec6fa5" };
  assert.equal(validateTheme(ok).ok, true, "the default palette passes");
  assert.equal(validateTheme({ ...ok, text: "#20242c" }).ok, false, "unreadable text fails");
  assert.equal(validateTheme({ ...ok, saffron: "#3b2a10" }).ok, false, "button text must be readable on the accent");
  assert.equal(validateTheme({ ink: "#000000" }).ok, false, "all tokens required");
  assert.equal(validateGradient(["#fb923c", "#f43f5e"]).ok, true);
  assert.equal(validateGradient(["#111111", "#fb923c"]).ok, false, "too dark on the dark page");
  assert.equal(validateGradient(["#fb923c"]).ok, false);
});

test("custom items map to renderable catalogue items", () => {
  const base = { id: "ci_x", name: "Test", description: "A test item", rarity: "rare" as const, price: 300, event: null, status: "live" as const, artist: "Nadia", data: "{}" };
  const st = toShopItem({ ...base, type: "sticker", asset_key: "a".repeat(64) + ".webp", data: JSON.stringify({ anim: "bounce" }) });
  assert.equal(st.value, `img:/media/${"a".repeat(64)}.webp`);
  assert.equal(st.anim, "bounce");
  assert.equal(st.artist, "Nadia");
  assert.equal(toShopItem({ ...base, type: "frame", asset_key: "b".repeat(64) + ".webp" }).overlay, `/media/${"b".repeat(64)}.webp`);
  assert.equal(toShopItem({ ...base, type: "banner", asset_key: "c".repeat(64) + ".webp" }).image, `/media/${"c".repeat(64)}.webp`);
  const th = toShopItem({ ...base, type: "theme", asset_key: null, data: JSON.stringify({ theme: { ink: "#000000", text: "#ffffff" } }) });
  assert.deepEqual(th.themeVars, { "--color-ink": "#000000", "--color-text": "#ffffff" });
  assert.equal(toShopItem({ ...base, type: "title", asset_key: null, data: JSON.stringify({ text: "Night Owl" }) }).value, "Night Owl");
  assert.equal(toShopItem({ ...base, type: "sticker", asset_key: null, event: "halloween" }).price, null, "event items aren't sold in the shop");
  assert.equal(toShopItem({ ...base, type: "sticker", asset_key: null, status: "retired" }).retired, true);
});

test("readiness: what must be true before publishing", () => {
  const d = { type: "sticker" as const, name: "Boo", description: "A spooky sticker", price: 100, event: null, event_price: null, asset_key: "k", assetOk: true, data: {} };
  assert.ok(readiness(d, true).every((r) => r.pass));
  assert.ok(!readiness({ ...d, asset_key: null }, true).every((r) => r.pass), "needs artwork");
  assert.ok(!readiness({ ...d, price: null }, true).every((r) => r.pass), "needs a price or an event");
  assert.ok(readiness({ ...d, price: null, event: "halloween", event_price: 0 }, true).every((r) => r.pass), "free event claim is fine");
  assert.ok(!readiness({ ...d, type: "theme", asset_key: null }, false).every((r) => r.pass), "themes need passing colour checks");
  assert.ok(readiness({ ...d, type: "effect", asset_key: null, data: { particles: ["✨"] } }, true).every((r) => r.pass), "particle effects need no upload");
});
