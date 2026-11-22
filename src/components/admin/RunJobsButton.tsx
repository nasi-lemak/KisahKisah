"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { runJobsNow } from "@/app/reminder-actions";
import { toast } from "../Toaster";

export function RunJobsButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => start(async () => {
      const r = await runJobsNow();
      toast({ icon: r.error ? "⚠️" : "⏱️", title: r.error ?? "Jobs ran", body: r.ok });
      router.refresh();
    })}>
      {pending ? "Running…" : "Run now"}
    </button>
  );
}
