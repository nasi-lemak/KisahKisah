import "server-only";
import { all, one, run, tx } from "./db";
import { notify } from "./rewards";
import { revokeAllSessions } from "./auth";
import { autoAction, type Reason, type Target } from "./moderation-core";

export type TargetInfo = { authorId: number; author: string; preview: string; url: string; hidden: boolean; spoiler?: boolean };

export function targetInfo(type: Target, id: number): TargetInfo | null {
  if (type === "review") {
    const r = one<{ user_id: number; username: string; body: string; hidden_at: string | null; spoiler: number }>(
      "SELECT r.user_id, u.username, r.body, r.hidden_at, r.spoiler FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?", id);
    return r ? { authorId: r.user_id, author: r.username, preview: r.body.slice(0, 400), url: `/review/${id}`, hidden: !!r.hidden_at, spoiler: !!r.spoiler } : null;
  }
  if (type === "comment") {
    const c = one<{ user_id: number; username: string; body: string; review_id: number; hidden_at: string | null }>(
      "SELECT c.user_id, u.username, c.body, c.review_id, c.hidden_at FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?", id);
    return c ? { authorId: c.user_id, author: c.username, preview: c.body.slice(0, 400), url: `/review/${c.review_id}#c${id}`, hidden: !!c.hidden_at } : null;
  }
  if (type === "list") {
    const l = one<{ user_id: number; username: string; title: string; description: string; hidden_at: string | null }>(
      "SELECT l.user_id, u.username, l.title, l.description, l.hidden_at FROM lists l JOIN users u ON u.id = l.user_id WHERE l.id = ?", id);
    return l ? { authorId: l.user_id, author: l.username, preview: `${l.title}: ${l.description}`.slice(0, 400), url: `/lists/${id}`, hidden: !!l.hidden_at } : null;
  }
  const u = one<{ id: number; username: string; display_name: string; bio: string; suspended_at: string | null }>("SELECT id, username, display_name, bio, suspended_at FROM users WHERE id = ?", id);
  return u ? { authorId: u.id, author: u.username, preview: `${u.display_name}: ${u.bio}`.slice(0, 400), url: `/u/${u.username}`, hidden: !!u.suspended_at } : null;
}

const table = (t: Exclude<Target, "user">) => ({ review: "reviews", comment: "comments", list: "lists" })[t];

export function setHidden(type: Exclude<Target, "user">, id: number, reason: string | null) {
  run(`UPDATE ${table(type)} SET hidden_at = ${reason ? "datetime('now')" : "NULL"}, hidden_reason = ? WHERE id = ?`, reason, id);
}

/** Record a report; hide or blur automatically once enough different members agree. */
export function fileReport(reporterId: number, type: Target, id: number, reason: Reason, note: string): "new" | "duplicate" {
  const ins = run("INSERT OR IGNORE INTO reports (reporter_id, target_type, target_id, reason, note) VALUES (?,?,?,?,?)", reporterId, type, id, reason, note);
  if (Number(ins.changes) !== 1) return "duplicate";
  if (type !== "user") {
    const reasons = all<{ reason: Reason }>("SELECT reason FROM reports WHERE target_type = ? AND target_id = ? AND status = 'open'", type, id).map((r) => r.reason);
    const act = autoAction(reasons, Math.max(1, Number(process.env.MOD_AUTO_HIDE) || 3));
    const info = targetInfo(type, id);
    if (act === "hide" && info && !info.hidden) {
      setHidden(type, id, "Hidden automatically after several reports, pending review");
      log(null, "auto-hide", type, id, reasons.join(","));
    } else if (act === "spoiler" && type === "review" && info && !info.spoiler) {
      run("UPDATE reviews SET spoiler = 1 WHERE id = ?", id);
      log(null, "auto-spoiler", type, id, "");
    }
  }
  return "new";
}

export function log(staffId: number | null, action: string, type: Target, id: number, note: string) {
  run("INSERT INTO moderation_log (staff_id, action, target_type, target_id, note) VALUES (?,?,?,?,?)", staffId, action, type, id, note);
}

export type ModAction = "hide" | "restore" | "spoiler" | "dismiss" | "suspend" | "unsuspend";

/** Staff decision on a target: applies it, closes its open reports, tells the people involved. */
export function moderate(staffId: number, type: Target, id: number, action: ModAction, note: string) {
  const info = targetInfo(type, id);
  if (!info) return;
  const reporters = all<{ reporter_id: number }>("SELECT DISTINCT reporter_id FROM reports WHERE target_type = ? AND target_id = ? AND status = 'open'", type, id);
  tx(() => {
    if (action === "hide" && type !== "user") setHidden(type, id, note || "Removed by moderators");
    if (action === "restore" && type !== "user") setHidden(type, id, null);
    if (action === "spoiler" && type === "review") run("UPDATE reviews SET spoiler = 1 WHERE id = ?", id);
    if (action === "suspend") suspend(info.authorId, note || "Community guidelines");
    if (action === "unsuspend") run("UPDATE users SET suspended_at = NULL, suspended_reason = NULL WHERE id = ?", info.authorId);
    const status = action === "dismiss" || action === "restore" || action === "unsuspend" ? "dismissed" : "actioned";
    run("UPDATE reports SET status = ?, handled_by = ?, handled_at = datetime('now') WHERE target_type = ? AND target_id = ? AND status = 'open'", status, staffId, type, id);
    log(staffId, action, type, id, note);
  });
  if (action === "hide") notify(info.authorId, "moderation", "🛡️", `Your ${type} was removed`, note ? `Reason: ${note}. Reply to support if you think this is a mistake.` : "It broke the community guidelines.");
  if (action === "spoiler") notify(info.authorId, "moderation", "🙈", "Your review is now marked as a spoiler", "Readers scratch to reveal it.");
  if (action === "hide" || action === "spoiler" || action === "suspend") {
    for (const r of reporters) notify(r.reporter_id, "moderation", "🛡️", "Thanks for your report", "We reviewed it and took action.");
  }
}

export function suspend(userId: number, reason: string) {
  run("UPDATE users SET suspended_at = datetime('now'), suspended_reason = ? WHERE id = ?", reason, userId);
  revokeAllSessions(userId);
}

/** The suspension reason, or null if the member is in good standing. */
export function isSuspended(userId: number): string | null {
  const u = one<{ r: string | null; s: string | null }>("SELECT suspended_reason r, suspended_at s FROM users WHERE id = ?", userId);
  return u?.s ? u.r || "Community guidelines" : null;
}

/** Either person blocked the other. */
export function blockedBetween(a: number, b: number): boolean {
  return !!one("SELECT 1 x FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)", a, b, b, a);
}

export function hasBlocked(blocker: number, blocked: number): boolean {
  return !!one("SELECT 1 x FROM blocks WHERE blocker_id = ? AND blocked_id = ?", blocker, blocked);
}

export function openReportGroups() {
  return all<{ target_type: Target; target_id: number; n: number; reasons: string; notes: string; first_at: string }>(
    `SELECT target_type, target_id, COUNT(*) n, GROUP_CONCAT(reason) reasons, GROUP_CONCAT(NULLIF(note, ''), ' · ') notes, MIN(created_at) first_at
     FROM reports WHERE status = 'open' GROUP BY target_type, target_id ORDER BY n DESC, first_at`,
  );
}
