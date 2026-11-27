import { test } from "node:test";
import assert from "node:assert/strict";
import { base32Decode, base32Encode, hotp, totp, verifyTotp, otpauthUrl, newRecoveryCodes, normalizeRecovery, newSecret } from "../src/lib/totp-core.ts";

const RFC_KEY = Buffer.from("12345678901234567890"); // RFC 6238 Appendix B (SHA-1)

test("totp: RFC 6238 test vectors (8 digits)", () => {
  for (const [t, code] of [[59, "94287082"], [1111111109, "07081804"], [1111111111, "14050471"], [1234567890, "89005924"], [2000000000, "69279037"], [20000000000, "65353130"]] as const) {
    assert.equal(totp(RFC_KEY, t * 1000, 8), code, `T=${t}`);
  }
});

test("hotp: RFC 4226 test vectors", () => {
  const want = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
  want.forEach((w, i) => assert.equal(hotp(RFC_KEY, i), w));
});

test("totp: drift window and replay protection", () => {
  const now = 1_700_000_000_000;
  const code = totp(RFC_KEY, now);
  const step = verifyTotp(RFC_KEY, code, now)!;
  assert.ok(step);
  assert.equal(verifyTotp(RFC_KEY, code, now, step), null, "same code can't be used twice");
  assert.ok(verifyTotp(RFC_KEY, totp(RFC_KEY, now - 30_000), now), "previous step accepted");
  assert.equal(verifyTotp(RFC_KEY, totp(RFC_KEY, now - 90_000), now), null, "old codes rejected");
  assert.equal(verifyTotp(RFC_KEY, "12345", now), null);
  assert.equal(verifyTotp(RFC_KEY, "abcdef", now), null);
});

test("base32, otpauth URL, recovery codes", () => {
  assert.equal(base32Encode(Buffer.from("foobar")), "MZXW6YTBOI");
  assert.equal(base32Decode("MZXW6YTBOI").toString(), "foobar");
  assert.equal(base32Decode(newSecret()).length, 20);
  assert.match(otpauthUrl("ABC", "aisyah"), /^otpauth:\/\/totp\/KisahKisah%3Aaisyah\?secret=ABC&issuer=KisahKisah/);
  const codes = newRecoveryCodes();
  assert.equal(codes.length, 10);
  assert.equal(new Set(codes).size, 10);
  assert.match(codes[0], /^[a-z2-9]{4}-[a-z2-9]{4}$/);
  assert.equal(normalizeRecovery(" K7Q2-9XVD "), "k7q29xvd");
});
