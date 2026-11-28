/** Pure rules for reports and moderation. */

export const TARGETS = ["review", "comment", "list", "user"] as const;
export type Target = (typeof TARGETS)[number];

export const REASONS = {
  spam: "Spam or advertising",
  harassment: "Harassment or bullying",
  hate: "Hate or discrimination",
  spoiler: "Unmarked spoilers",
  sexual: "Sexual or violent content",
  copyright: "Copyright or piracy links",
  other: "Something else",
} as const;
export type Reason = keyof typeof REASONS;

export const isTarget = (x: unknown): x is Target => typeof x === "string" && (TARGETS as readonly string[]).includes(x);
export const isReason = (x: unknown): x is Reason => typeof x === "string" && Object.hasOwn(REASONS, x);

/**
 * Content is hidden automatically, pending staff review, once enough different
 * members report it. Spoiler reports only ever blur (mark as spoiler), never hide.
 */
export function autoAction(openReasons: Reason[], threshold = 3): "hide" | "spoiler" | null {
  if (openReasons.length < threshold) return null;
  const nonSpoiler = openReasons.filter((r) => r !== "spoiler").length;
  if (nonSpoiler >= threshold) return "hide";
  return openReasons.length >= threshold ? "spoiler" : null;
}

/** Most-cited reason first, for the staff queue. */
export function reasonSummary(reasons: Reason[]): { reason: Reason; n: number }[] {
  const m = new Map<Reason, number>();
  for (const r of reasons) m.set(r, (m.get(r) ?? 0) + 1);
  return [...m.entries()].map(([reason, n]) => ({ reason, n })).sort((a, b) => b.n - a.n);
}

/** Columns that tie a row to a member, for data export and account deletion. */
export const PERSON_COLUMNS = ["user_id", "follower_id", "followee_id", "blocker_id", "blocked_id", "reporter_id", "redeemed_by", "added_by", "submitted_by"];

/** Rows that are business records: kept (pointing at the anonymised account) when a member deletes their account. */
export const KEEP_ON_DELETE = new Set(["payouts", "item_comments", "item_versions", "custom_items", "cinema_tickets", "moderation_log", "orders", "invoices", "campaign_ticket_bonuses"]);

/** Never exported (secrets or other people's security data). */
export const NEVER_EXPORT = new Set(["sessions", "auth_tokens", "auth_attempts", "recovery_codes", "analytics_uniques", "outbox", "moderation_log"]);

/** Account fields never included in an export. */
export const SECRET_USER_FIELDS = ["password_hash", "totp_secret", "totp_pending", "totp_last_step"];
