"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleReminder } from "@/app/reminder-actions";
import { toast } from "./Toaster";

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function NotifyButton({ target, date, initial, signedIn, verified }: { target: string; date: string; initial: { on: boolean; count: number }; signedIn: boolean; verified: boolean }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  if (!signedIn) {
    return <Link href="/login" className="btn btn-ghost">🔔 Sign in to get a reminder on {fmt(date)}</Link>;
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
          else if (r.on) toast({ icon: "🔔", title: `We'll remind you on ${fmt(date)}`, body: verified ? "In your notifications and by email." : "In your notifications. Confirm your email to get it by email too." });
        })}
      >
        {s.on ? "🔔 Reminder set" : `🔔 Notify me on ${fmt(date)}`}
      </button>
      {s.count > 0 && <span className="text-sm text-muted">{s.count.toLocaleString()} waiting</span>}
    </div>
  );
}
