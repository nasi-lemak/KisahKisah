import "server-only";
import { randomBytes } from "node:crypto";
import { all, db, one, run, tx } from "./db";
import { KEEP_ON_DELETE, NEVER_EXPORT, PERSON_COLUMNS, SECRET_USER_FIELDS } from "./moderation-core";

type Col = { name: string; notnull: number; pk: number };

/** Every table with a column that points at a member. Read from the schema, so new tables are covered. */
function personTables(): { table: string; cols: Col[] }[] {
  const tables = all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != 'users'");
  return tables
    .map(({ name }) => ({ table: name, cols: (db().prepare(`PRAGMA table_info("${name}")`).all() as Col[]).filter((c) => PERSON_COLUMNS.includes(c.name)) }))
    .filter((t) => t.cols.length > 0);
}

/** Everything a member has put into KisahKisah, as plain JSON (no passwords, tokens or other people's private data). */
export function exportAccount(userId: number) {
  const user = one<Record<string, unknown>>("SELECT * FROM users WHERE id = ?", userId);
  if (!user) return null;
  for (const f of SECRET_USER_FIELDS) delete user[f];
  const data: Record<string, unknown[]> = {};
  for (const { table, cols } of personTables()) {
    if (NEVER_EXPORT.has(table)) continue;
    const where = cols.map((c) => `"${c.name}" = ?`).join(" OR ");
    const rows = all<Record<string, unknown>>(`SELECT * FROM "${table}" WHERE ${where}`, ...cols.map(() => userId));
    if (rows.length) data[table] = rows;
  }
  return {
    format: "kisahkisah-export/1",
    exported_at: new Date().toISOString(),
    note: "Your account and everything linked to it. Rows from shared things (like comments on your reviews) include other members' ids but not their personal details.",
    account: user,
    data,
  };
}

/**
 * Erase a member: their personal content goes, and the account row is anonymised
 * (kept only so invoices, artist payouts and moderation records still add up).
 */
export function deleteAccount(userId: number) {
  tx(() => {
    for (const { table, cols } of personTables()) {
      if (KEEP_ON_DELETE.has(table)) continue;
      for (const c of cols) {
        // Required or key columns: the row is theirs, delete it. Optional ones: just unlink.
        if (c.notnull || c.pk) run(`DELETE FROM "${table}" WHERE "${c.name}" = ?`, userId);
        else run(`UPDATE "${table}" SET "${c.name}" = NULL WHERE "${c.name}" = ?`, userId);
      }
    }
    run(
      `UPDATE users SET username = ?, display_name = 'Deleted member', email = NULL, email_verified_at = NULL, bio = '', password_hash = '!',
         avatar_item = 'av_popcorn', frame_item = NULL, banner_item = NULL, title_item = NULL, theme_item = NULL, effect_item = NULL, namestyle_item = NULL,
         accent1 = NULL, accent2 = NULL, pinned_review_id = NULL, points = 0, locale = NULL, totp_secret = NULL, totp_pending = NULL, totp_enabled_at = NULL,
         role = 'member', deleted_at = datetime('now') WHERE id = ?`,
      `deleted-${userId}-${randomBytes(3).toString("hex")}`, userId,
    );
  });
}
