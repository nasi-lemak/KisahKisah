"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleReminder } from "@/app/reminder-actions";
import { toast } from "./Toaster";
import { useFormatDate, useT } from "./I18n";


export function NotifyButton({ target, date, initial, signedIn, verified }: { target: string; date: string; initial: { on: boolean; count: number }; signedIn: boolean; verified: boolean }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const t = useT();
  const fmtDate = useFormatDate();
  const fmt = (d: string) => fmtDate(d);
  if (!signedIn) {
    return <Link href="/login" className="btn btn-ghost">{t("notify.signIn", { date: fmt(date) })}</Link>;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button" disabled={pending} aria-pressed={s.on}
        className={`btn ${s.on ? "btn-ghost border-jade text-jade" : "btn-primary"}`}
        onClick={() => start(async () => {
          const r = await toggleReminder(target);
          setS({ on: r.on, count: r.count });
          if (r.error) toast({ icon: "⚠️", title: r.error });
          else if (r.on) toast({ icon: "🔔", title: t("notify.toast", { date: fmt(date) }), body: verified ? t("notify.toastEmail") : t("notify.toastNoEmail") });
        })}
      >
        {s.on ? t("notify.set") : t("notify.on", { date: fmt(date) })}
      </button>
      {s.count > 0 && <span className="text-sm text-muted">{t("notify.waiting", { n: s.count.toLocaleString() })}</span>}
    </div>
  );
}
