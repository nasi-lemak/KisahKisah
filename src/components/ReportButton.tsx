"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/moderation-actions";
import { toggleBlock } from "@/app/moderation-actions";
import { REASONS } from "@/lib/moderation-core";
import { toast } from "./Toaster";

/** "Report" link that opens a small form. Works on reviews, comments, catalogues and profiles. */
export function ReportButton({ type, id, signedIn, label = "Report" }: { type: "review" | "comment" | "list" | "user"; id: number; signedIn: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (!signedIn) return null;
  if (done) return <span className="text-xs text-muted">✓ Reported</span>;
  return (
    <span className="relative inline-block">
      <button type="button" className="text-xs text-muted hover:text-chili" onClick={() => setOpen(!open)} aria-expanded={open}>⚑ {label}</button>
      {open && (
        <form
          className="card absolute right-0 z-30 mt-1 w-64 space-y-2 p-3 text-left text-sm shadow-2xl"
          action={(fd) => start(async () => {
            const r = await reportContent(type, id, fd);
            toast({ icon: r?.error ? "⚠️" : "🛡️", title: r?.error ?? r?.ok ?? "" });
            if (r?.ok) { setDone(true); setOpen(false); }
          })}
        >
          <div className="font-semibold">What's wrong?</div>
          {Object.entries(REASONS).map(([k, v]) => (
            <label key={k} className="flex items-center gap-2"><input type="radio" name="reason" value={k} required /> {v}</label>
          ))}
          <textarea name="note" maxLength={500} className="input min-h-14 text-xs" placeholder="Anything that helps us (optional)" aria-label="Details" />
          <div className="flex gap-2">
            <button className="btn btn-primary py-1 text-xs" disabled={pending}>{pending ? "…" : "Send report"}</button>
            <button type="button" className="btn btn-ghost py-1 text-xs" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </span>
  );
}

export function BlockButton({ userId, name, initial }: { userId: number; name: string; initial: boolean }) {
  const [blocked, setBlocked] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button" disabled={pending} className="text-xs text-muted hover:text-chili"
      onClick={() => {
        if (!blocked && !confirm(`Block ${name}? You won't see each other's reviews or comments, they can't comment on yours, and you'll stop following each other.`)) return;
        start(async () => { const r = await toggleBlock(userId); setBlocked(r.blocked); toast({ icon: "🚫", title: r.error ?? (r.blocked ? `Blocked ${name}` : `Unblocked ${name}`) }); });
      }}
    >
      {blocked ? "Unblock" : "🚫 Block"}
    </button>
  );
}
