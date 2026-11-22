import { all } from "@/lib/db";
import { mailConfigured } from "@/lib/mail";

type Row = { id: number; to_addr: string; subject: string; body: string; sent_at: string | null; error: string | null; created_at: string };

/** Delivery log. Message bodies are only shown when no mail provider is configured (development). */
export default function Outbox() {
  const live = mailConfigured();
  const rows = all<Row>("SELECT * FROM outbox ORDER BY id DESC LIMIT 50");
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Outbox</h1>
      <p className="text-sm text-muted">
        {live
          ? "Mail is delivered through Resend. Bodies are cleared after sending, so only the delivery log is shown."
          : "No mail provider is configured (set RESEND_API_KEY and MAIL_FROM), so emails stop here. Use this page to follow links while developing."}
      </p>
      {rows.length === 0 && <div className="glass p-6 text-sm text-muted">Nothing sent yet.</div>}
      {rows.map((r) => (
        <article key={r.id} className="glass space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <b>{r.subject}</b>
            <span className="text-muted">→ {r.to_addr}</span>
            <span className="ml-auto text-xs text-muted">{r.created_at} · {r.sent_at ? "✓ sent" : r.error ? `✗ ${r.error}` : "not sent"}</span>
          </div>
          {!live && r.body && <pre className="whitespace-pre-wrap break-words rounded-lg bg-black/30 p-3 text-xs">{r.body}</pre>}
        </article>
      ))}
    </div>
  );
}
