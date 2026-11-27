import { test } from "node:test";
import assert from "node:assert/strict";
import { negotiate, format, placeholders, LOCALES, formatDate } from "../src/lib/i18n/core.ts";
import { MESSAGES } from "../src/lib/i18n/messages.ts";

test("i18n: Accept-Language negotiation", () => {
  assert.equal(negotiate("ms-MY,ms;q=0.9,en;q=0.8"), "ms");
  assert.equal(negotiate("fr-FR,fr;q=0.9,th;q=0.5"), "th", "first supported wins");
  assert.equal(negotiate("en;q=0.2, ko;q=0.9"), "ko", "q-values respected");
  assert.equal(negotiate("fil-PH"), "tl");
  assert.equal(negotiate("in-ID"), "id", "legacy Indonesian tag");
  assert.equal(negotiate("de-DE"), "en");
  assert.equal(negotiate(""), "en");
  assert.equal(negotiate("vi;q=0"), "en", "q=0 means not acceptable");
});

test("i18n: formatting", () => {
  assert.equal(format("Join free (+{kp} KP)", { kp: 100 }), "Join free (+100 KP)");
  assert.equal(format("Hi {name}"), "Hi {name}", "missing vars stay visible");
});

test("i18n: every language has every key with the same placeholders", () => {
  const keys = Object.keys(MESSAGES.en) as (keyof typeof MESSAGES.en)[];
  for (const { code } of LOCALES) {
    const dict = MESSAGES[code];
    for (const k of keys) {
      assert.ok(dict[k]?.trim(), `${code} is missing ${k}`);
      assert.deepEqual(placeholders(dict[k]), placeholders(MESSAGES.en[k]), `${code}:${k} placeholders`);
    }
    assert.equal(Object.keys(dict).length, keys.length, `${code} has extra keys`);
  }
});

test("i18n: dates in the viewer's language", () => {
  assert.equal(formatDate("2026-11-27", "en"), "27 November 2026");
  assert.equal(formatDate("2026-11-27", "en", "short"), "27 Nov");
  assert.match(formatDate("2026-11-27", "ms"), /27 November 2026/);
  assert.match(formatDate("2026-11-27", "ko"), /2026.*11.*27/);
  assert.match(formatDate("2026-11-27", "vi"), /27/);
  assert.equal(formatDate("not-a-date", "en"), "not-a-date");
});
