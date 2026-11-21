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
  assert.match(justWatchLink("Mai", null)!, /justwatch\.com\/my\//);
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
