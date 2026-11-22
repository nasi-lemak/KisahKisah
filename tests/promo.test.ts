import { test } from "node:test";
import assert from "node:assert/strict";
import { isTargeted, visibleTo, activeOccurrence, nextOccurrence } from "../src/lib/events.ts";
import { isBot, optedOut, dailyHash, ctr } from "../src/lib/analytics-core.ts";
import { bonusLabel, campaignToEvent, houseToEvent, slugify, validateSchedule, type HouseEventRow } from "../src/lib/workflow.ts";

test("geo-targeting: untargeted events reach everyone", () => {
  assert.equal(isTargeted({}), false);
  assert.equal(isTargeted({ markets: [] }), false);
  assert.equal(isTargeted({ markets: ["GLOBAL", "MY"] }), false);
  assert.equal(visibleTo({}, null), true);
  assert.equal(visibleTo({ markets: ["GLOBAL"] }, "FR"), true);
});

test("geo-targeting: targeted events reach only their markets (staff see all)", () => {
  const e = { markets: ["MY", "SG"] };
  assert.equal(isTargeted(e), true);
  assert.equal(visibleTo(e, "MY"), true);
  assert.equal(visibleTo(e, "FR"), false);
  assert.equal(visibleTo(e, null), false, "unknown country gets untargeted events only");
  assert.equal(visibleTo(e, "all"), true);
});

test("analytics: bots, opt-outs, hashing and CTR", () => {
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot(""), true, "no user agent is treated as a bot");
  assert.equal(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1"), false);
  assert.equal(optedOut("1", null), true);
  assert.equal(optedOut(null, "1"), true);
  assert.equal(optedOut(null, null), false);
  const a = dailyHash("s", "2026-11-22", "u:1");
  assert.equal(a, dailyHash("s", "2026-11-22", "u:1"), "stable within a day");
  assert.notEqual(a, dailyHash("s", "2026-11-23", "u:1"), "rotates daily, so viewers can't be followed across days");
  assert.notEqual(a, dailyHash("t", "2026-11-22", "u:1"));
  assert.equal(a.length, 32);
  assert.equal(ctr(5, 200), 2.5, "percent");
  assert.equal(ctr(3, 0), 0);
});

test("campaign markets are parsed and GLOBAL means everywhere", () => {
  const base = { id: 7, title: "T", tagline: "", synopsis: "", release_date: null, motif: "", country: "MY", starts_on: "2026-12-01", ends_on: "2026-12-07", color1: "#000000", color2: "#ffffff", org_name: "Org", featured: "" };
  assert.deepEqual(campaignToEvent({ ...base, markets: "my, sg,junk" }).markets, ["MY", "SG"]);
  assert.equal(campaignToEvent({ ...base, markets: "GLOBAL" }).markets, undefined);
  assert.equal(campaignToEvent(base).markets, undefined);
});

const row = (o: Partial<HouseEventRow> = {}): HouseEventRow => ({
  id: "he-test", name: "Test Fest", icon: "🎉", tagline: "t", blurb: "b", color1: "#111111", color2: "#222222",
  repeat: "yearly", starts: "12-30", ends: "01-02", bonus_points: 10, bonus_max: 3, bonus_genres: "Horror", bonus_countries: "TH",
  featured: "a-2020,b-2021", markets: "", enabled: 1, ...o,
});

test("house events: yearly rules wrap the new year", () => {
  const e = houseToEvent(row());
  assert.equal(e.kind, "house");
  assert.deepEqual(e.featured, ["a-2020", "b-2021"]);
  assert.equal(e.markets, undefined);
  assert.ok(activeOccurrence(e, "2027-01-01"), "live across new year");
  assert.equal(activeOccurrence(e, "2026-12-29"), null);
  assert.equal(nextOccurrence(e, "2026-06-01")?.start, "2026-12-30");
  assert.equal(e.bonus?.points, 10);
});

test("house events: one-off rules, no bonus without a filter, markets", () => {
  const e = houseToEvent(row({ repeat: "once", starts: "2027-03-20", ends: "2027-03-22", bonus_genres: "", bonus_countries: "", markets: "ID,MY" }));
  assert.equal(e.bonus, undefined, "points without a genre/country filter would be a blanket bonus");
  assert.deepEqual(e.markets, ["ID", "MY"]);
  assert.equal(nextOccurrence(e, "2028-01-01"), null);
  assert.ok(activeOccurrence(e, "2027-03-21"));
});

test("house events: schedule validation", () => {
  assert.deepEqual(validateSchedule("yearly", "02-29", "03-01"), []);
  assert.ok(validateSchedule("yearly", "02-30", "03-01").length);
  assert.ok(validateSchedule("yearly", "2026-02-01", "03-01").length);
  assert.deepEqual(validateSchedule("once", "2027-01-01", "2027-01-01"), []);
  assert.ok(validateSchedule("once", "2027-01-05", "2027-01-01").length, "end before start");
  assert.ok(validateSchedule("once", "2027-02-31", "2027-03-01").length);
});

test("house events: labels and slugs", () => {
  assert.equal(bonusLabel(["Horror"], []), "Log a horror title");
  assert.match(bonusLabel(["Horror"], ["TH"], (c) => (c === "TH" ? "Thailand" : c)), /Thailand/);
  assert.equal(slugify("Hari Raya Haji 2027!"), "hari-raya-haji-2027");
  assert.equal(slugify("   "), "event");
});
