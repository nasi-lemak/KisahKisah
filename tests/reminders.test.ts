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

import { quizProblems, scoreQuiz, quizPoints } from "../src/lib/quiz-core.ts";

test("quiz: validation", () => {
  const ok = { question: "Which island is the film set on?", options: ["Pulau Hantu", "Langkawi", "Sentosa"], answer: 0, explanation: "" };
  assert.deepEqual(quizProblems(ok), []);
  assert.ok(quizProblems({ ...ok, options: ["Only one"] }).length);
  assert.ok(quizProblems({ ...ok, answer: 3 }).length);
  assert.ok(quizProblems({ ...ok, options: ["Same", "same"] }).length);
  assert.ok(quizProblems({ ...ok, question: "Why?" }).length);
});

test("quiz: scoring and points", () => {
  assert.deepEqual(scoreQuiz([0, 2, 1], [0, 2, 0]), { correct: 2, total: 3, results: [true, true, false] });
  assert.equal(scoreQuiz([0, 1], ["0", null]).correct, 0, "strings and gaps don't count");
  assert.equal(scoreQuiz([0, 1], [0]).correct, 1);
  assert.equal(quizPoints(3, 3, 20), 25, "perfect bonus");
  assert.equal(quizPoints(2, 3, 20), 13);
  assert.equal(quizPoints(0, 3, 20), 0);
});

import { orderTotals, instalment, formatMoney, toMinor, docNumber, minorDigits } from "../src/lib/billing-core.ts";

test("billing: totals, tax, discount", () => {
  const t = orderTotals([{ label: "Premiere", qty: 1, unit: 1_200_000 }, { label: "Extra market", qty: 2, unit: 150_000 }], 100_000, 0.08);
  assert.deepEqual(t, { subtotal: 1_500_000, discount: 100_000, taxable: 1_400_000, tax: 112_000, total: 1_512_000 });
  assert.equal(orderTotals([{ label: "x", qty: 1, unit: 100 }], 500, 0).total, 0, "discount never goes negative");
});

test("billing: instalments add up exactly", () => {
  const total = 1_000_001, tax = 74_074;
  const a = instalment(total, tax, 0, 50)!;
  const b = instalment(total, tax, a.amount, 50)!;
  assert.equal(a.amount + b.amount, total);
  assert.equal(instalment(total, tax, total, 10), null, "nothing left");
  assert.equal(instalment(total, tax, a.amount, 80)!.amount, total - a.amount, "capped at what's left");
});

test("billing: money formats and numbers", () => {
  assert.equal(formatMoney(1_512_000, "USD"), "US$15,120.00");
  assert.equal(minorDigits("JPY"), 0);
  assert.equal(toMinor("12,000.50", "USD"), 1_200_050);
  assert.equal(toMinor("1500", "JPY"), 1500);
  assert.equal(toMinor("abc", "USD"), null);
  assert.equal(docNumber("INV", 2026, 7), "KK-INV-2026-0007");
});
