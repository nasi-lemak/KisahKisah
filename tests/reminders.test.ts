import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTarget, targetKey, canSignUp, reminderDue, ticketBonus, inMarkets } from "../src/lib/reminders-core.ts";

test("reminders: targets parse strictly", () => {
  assert.deepEqual(parseTarget("film:12"), { kind: "film", id: 12 });
  assert.deepEqual(parseTarget("cmp:3"), { kind: "cmp", id: 3 });
  assert.equal(parseTarget("film:"), null);
  assert.equal(parseTarget("user:1"), null);
  assert.equal(parseTarget("film:1;DROP"), null);
  assert.equal(targetKey({ kind: "cmp", id: 9 }), "cmp:9");
});

test("reminders: sign up before release, send on the day, drop when stale", () => {
  assert.equal(canSignUp("2026-12-01", "2026-11-22"), true);
  assert.equal(canSignUp("2026-11-22", "2026-11-22"), false, "release day itself is too late to sign up");
  assert.equal(canSignUp(null, "2026-11-22"), false);
  assert.equal(reminderDue("2026-12-01", "2026-11-22"), "wait");
  assert.equal(reminderDue("2026-11-22", "2026-11-22"), "due");
  assert.equal(reminderDue("2026-11-10", "2026-11-22"), "due", "catches up after downtime");
  assert.equal(reminderDue("2026-11-01", "2026-11-22"), "stale");
  assert.equal(reminderDue(null, "2026-11-22"), "wait", "date moved to unknown: keep waiting");
});

test("ticket bonus: percentage of ticket points, capped", () => {
  assert.equal(ticketBonus(80, 50), 40);
  assert.equal(ticketBonus(80, 0), 0);
  assert.equal(ticketBonus(0, 50), 0);
  assert.equal(ticketBonus(3, 10), 1, "never rounds a real bonus down to nothing");
  assert.equal(ticketBonus(400, 1000), 500, "percent clamps at 300, total at the cap");
});

test("markets", () => {
  assert.equal(inMarkets("", "FR"), true);
  assert.equal(inMarkets("GLOBAL", null), true);
  assert.equal(inMarkets("MY,SG", "SG"), true);
  assert.equal(inMarkets("MY,SG", "FR"), false);
  assert.equal(inMarkets("MY", null), false);
});
