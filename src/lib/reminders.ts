import "server-only";
import { all, one, run } from "./db";
import { notify } from "./rewards";
import { sendMail } from "./mail";
import { siteUrl } from "./site";
import { today } from "./events";
import { parseTarget, reminderDue, type Target } from "./reminders-core";

export type TargetInfo = { title: string; date: string | null; url: string; markets: string | null; icon: string };

export function targetInfo(t: Target): TargetInfo | null {
  if (t.kind === "film") {
    const f = one<{ title: string; slug: string; release_date: string | null; motif: string }>("SELECT title, slug, release_date, motif FROM films WHERE id = ?", t.id);
    return f ? { title: f.title, date: f.release_date, url: `/film/${f.slug}`, markets: null, icon: f.motif } : null;
  }
  const c = one<{ title: string; release_date: string | null; markets: string; status: string; motif: string }>("SELECT title, release_date, markets, status, motif FROM campaigns WHERE id = ?", t.id);
  return c && c.status === "scheduled" ? { title: c.title, date: c.release_date, url: `/events/cmp-${t.id}`, markets: c.markets, icon: c.motif } : null;
}

export function reminderState(userId: number | null, target: string) {
  const count = one<{ n: number }>("SELECT COUNT(*) n FROM reminders WHERE target = ?", target)?.n ?? 0;
  const on = userId ? !!one("SELECT 1 x FROM reminders WHERE user_id = ? AND target = ?", userId, target) : false;
  return { on, count };
}

/** Sign-ups for a campaign: its own button plus the linked catalogue title's, by country. */
export function campaignSignups(campaignId: number, filmSlug: string | null) {
  const film = filmSlug ? one<{ id: number }>("SELECT id FROM films WHERE slug = ?", filmSlug) : undefined;
  const targets = [`cmp:${campaignId}`, ...(film ? [`film:${film.id}`] : [])];
  const marks = targets.map(() => "?").join(",");
  const total = one<{ n: number; sent: number }>(
    `SELECT COUNT(DISTINCT r.user_id) n, COUNT(DISTINCT CASE WHEN r.sent_at IS NOT NULL THEN r.user_id END) sent FROM reminders r WHERE r.target IN (${marks})`, ...targets,
  )!;
  const byCountry = all<{ country: string; n: number }>(
    `SELECT u.home_country country, COUNT(DISTINCT r.user_id) n FROM reminders r JOIN users u ON u.id = r.user_id WHERE r.target IN (${marks}) GROUP BY u.home_country ORDER BY n DESC`, ...targets,
  );
  return { signups: total.n, sent: total.sent, byCountry };
}

/** Send every reminder whose release day has come. Safe to run repeatedly. */
export async function runReminders(day = today()): Promise<{ sent: number; emailed: number; stale: number }> {
  const pending = all<{ target: string }>("SELECT DISTINCT target FROM reminders WHERE sent_at IS NULL");
  const base = await siteUrl();
  let sent = 0, emailed = 0, stale = 0;
  for (const { target } of pending) {
    const t = parseTarget(target);
    const info = t && targetInfo(t);
    const due = info ? reminderDue(info.date, day) : "stale";
    if (due === "wait") continue;
    const users = all<{ user_id: number; email: string | null; verified: string | null; name: string }>(
      `SELECT r.user_id, u.email, u.email_verified_at verified, u.display_name name FROM reminders r JOIN users u ON u.id = r.user_id
       WHERE r.target = ? AND r.sent_at IS NULL`, target,
    );
    for (const u of users) {
      // Claim the row first so overlapping runs never double-send.
      const claimed = run("UPDATE reminders SET sent_at = datetime('now') WHERE user_id = ? AND target = ? AND sent_at IS NULL", u.user_id, target);
      if (Number(claimed.changes) !== 1) continue;
      if (due === "stale" || !info) { stale++; continue; }
      notify(u.user_id, "reminder", "🔔", `Out today: ${info.title}`, "You asked us to remind you. Find a screening, then log it.");
      sent++;
      if (u.email && u.verified) {
        await sendMail({
          to: u.email,
          subject: `Out today: ${info.title}`,
          text: `Hi ${u.name},\n\n${info.title} is out today. You asked us to remind you.\n\n${base}${info.url}\n\nPartner-cinema tickets earn KP: ${base}/cinemas\n\nYou're getting this because you tapped "Notify me". It's a one-off.\nKisahKisah`,
        });
        emailed++;
      }
    }
  }
  return { sent, emailed, stale };
}
