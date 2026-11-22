import { test } from "node:test";
import assert from "node:assert/strict";
import { throttle, passwordProblem, validEmail, normalizeEmail, hashToken, maskEmail, minutes } from "../src/lib/security-core.ts";

test("throttle: blocks at the limit and says when it lifts", () => {
  const now = 1_000_000_000;
  const win = 15 * 60_000;
  const four = [1, 2, 3, 4].map((i) => now - i * 60_000);
  assert.equal(throttle(four, now, 5, win).blocked, false);
  const five = [...four, now - 10 * 60_000];
  const r = throttle(five, now, 5, win);
  assert.equal(r.blocked, true);
  assert.equal(r.retryAfterMs, 5 * 60_000, "lifts when the oldest attempt leaves the window");
  assert.equal(throttle(five.map((t) => t - win), now, 5, win).blocked, false, "old attempts don't count");
  assert.equal(minutes(r.retryAfterMs), "5 minutes");
  assert.equal(minutes(1), "1 minute");
});

test("passwords: length, common, username, repeats", () => {
  assert.match(passwordProblem("short")!, /8 characters/);
  assert.match(passwordProblem("Password123")!, /common/);
  assert.match(passwordProblem("aisyah-rocks-2026", "aisyah")!, /username/);
  assert.match(passwordProblem("zzzzzzzzzz")!, /easy/);
  assert.equal(passwordProblem("kopi-peng-at-midnight", "aisyah"), null);
});

test("emails and tokens", () => {
  assert.equal(normalizeEmail("  Aisyah@Example.COM "), "aisyah@example.com");
  assert.equal(validEmail("a@b.co"), true);
  assert.equal(validEmail("a@b"), false);
  assert.equal(validEmail("a b@c.com"), false);
  assert.equal(hashToken("x").length, 64);
  assert.notEqual(hashToken("x"), hashToken("y"));
  assert.equal(maskEmail("aisyah@example.com"), "ai••••@example.com");
});
