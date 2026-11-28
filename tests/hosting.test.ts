import { test } from "node:test";
import assert from "node:assert/strict";
import { signRequest } from "../src/lib/s3-sign.ts";

// The worked example from AWS's "Signature Version 4: GET Object" documentation.
test("s3: SigV4 matches AWS's published example", () => {
  const h = signRequest({
    method: "GET",
    url: new URL("https://examplebucket.s3.amazonaws.com/test.txt"),
    region: "us-east-1",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    headers: { Range: "bytes=0-9" },
    date: new Date("2013-05-24T00:00:00Z"),
  });
  assert.equal(
    h.authorization,
    "AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request, SignedHeaders=host;range;x-amz-content-sha256;x-amz-date, Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
  );
});

import { autoAction, reasonSummary, isReason, isTarget } from "../src/lib/moderation-core.ts";

test("moderation: auto-hide only with enough non-spoiler reports", () => {
  assert.equal(autoAction(["spam", "spam"]), null);
  assert.equal(autoAction(["spam", "hate", "harassment"]), "hide");
  assert.equal(autoAction(["spoiler", "spoiler", "spoiler"]), "spoiler", "spoilers get blurred, not hidden");
  assert.equal(autoAction(["spoiler", "spam", "spoiler"]), "spoiler");
  assert.equal(autoAction(["spam"], 1), "hide");
  assert.deepEqual(reasonSummary(["spam", "hate", "spam"]), [{ reason: "spam", n: 2 }, { reason: "hate", n: 1 }]);
  assert.equal(isReason("spam"), true);
  assert.equal(isReason("toString"), false, "no prototype keys");
  assert.equal(isTarget("review"), true);
  assert.equal(isTarget("film"), false);
});
