import "server-only";
import { one, run } from "./db";

export type Mail = { to: string; subject: string; text: string };

/** Real delivery needs RESEND_API_KEY and MAIL_FROM. Without them, mail only goes to the outbox (dev). */
export function mailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/**
 * Every message is written to the outbox first, then delivered. In dev the
 * outbox is readable by staff at /admin/outbox; in production it's a delivery log
 * whose bodies are cleared once sent (they can contain sign-in links).
 */
export async function sendMail(m: Mail): Promise<boolean> {
  const id = Number(run("INSERT INTO outbox (to_addr, subject, body) VALUES (?,?,?)", m.to, m.subject, m.text).lastInsertRowid);
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "test") console.log(`[mail] to=${m.to} subject="${m.subject}" (no provider configured; see /admin/outbox)`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [m.to], subject: m.subject, text: m.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    run("UPDATE outbox SET sent_at = datetime('now'), body = '' WHERE id = ?", id);
    return true;
  } catch (e) {
    run("UPDATE outbox SET error = ? WHERE id = ?", String((e as Error).message).slice(0, 200), id);
    return false;
  }
}

export function lastMailTo(to: string): { subject: string; body: string } | undefined {
  return one("SELECT subject, body FROM outbox WHERE to_addr = ? ORDER BY id DESC LIMIT 1", to);
}
