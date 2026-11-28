"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/moderation-actions";
import { toggleBlock } from "@/app/moderation-actions";
import { REASONS, type Reason } from "@/lib/moderation-core";
import type { MoreKey } from "@/lib/i18n/more/en";
import { toast } from "./Toaster";
import { useT } from "./I18n";

/** Member-facing reason labels; REASONS stays the English source for the admin queue. */
const REASON_KEYS: Record<Reason, MoreKey> = {
  spam: "report.reason.spam",
  harassment: "report.reason.harassment",
  hate: "report.reason.hate",
  spoiler: "report.reason.spoiler",
  sexual: "report.reason.sexual",
  copyright: "report.reason.copyright",
  other: "report.reason.other",
};

/** "Report" link that opens a small form. Works on reviews, comments, catalogues and profiles. */
export function ReportButton({ type, id, signedIn, label }: { type: "review" | "comment" | "list" | "user"; id: number; signedIn: boolean; label?: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const t = useT();
  if (!signedIn) return null;
  if (done) return <span className="text-xs text-muted">{t("report.done")}</span>;
  return (
    <span className="relative inline-block">
      <button type="button" className="text-xs text-muted hover:text-chili" onClick={() => setOpen(!open)} aria-expanded={open}>⚑ {label ?? t("report.label")}</button>
      {open && (
        <form
          className="card absolute right-0 z-30 mt-1 w-64 space-y-2 p-3 text-left text-sm shadow-2xl"
          action={(fd) => start(async () => {
            const r = await reportContent(type, id, fd);
            toast({ icon: r?.error ? "⚠️" : "🛡️", title: r?.error ?? r?.ok ?? "" });
            if (r?.ok) { setDone(true); setOpen(false); }
          })}
        >
          <div className="font-semibold">{t("report.what")}</div>
          {(Object.keys(REASONS) as Reason[]).map((k) => (
            <label key={k} className="flex items-center gap-2"><input type="radio" name="reason" value={k} required /> {t(REASON_KEYS[k])}</label>
          ))}
          <textarea name="note" maxLength={500} className="input min-h-14 text-xs" placeholder={t("report.notePlaceholder")} aria-label={t("report.details")} />
          <div className="flex gap-2">
            <button className="btn btn-primary py-1 text-xs" disabled={pending}>{pending ? "…" : t("report.send")}</button>
            <button type="button" className="btn btn-ghost py-1 text-xs" onClick={() => setOpen(false)}>{t("report.cancel")}</button>
          </div>
        </form>
      )}
    </span>
  );
}

export function BlockButton({ userId, name, initial }: { userId: number; name: string; initial: boolean }) {
  const [blocked, setBlocked] = useState(initial);
  const [pending, start] = useTransition();
  const t = useT();
  return (
    <button
      type="button" disabled={pending} className="text-xs text-muted hover:text-chili"
      onClick={() => {
        if (!blocked && !confirm(t("report.blockConfirm", { name }))) return;
        start(async () => { const r = await toggleBlock(userId); setBlocked(r.blocked); toast({ icon: "🚫", title: r.error ?? (r.blocked ? t("report.blocked", { name }) : t("report.unblocked", { name })) }); });
      }}
    >
      {blocked ? t("report.unblock") : t("report.block")}
    </button>
  );
}
