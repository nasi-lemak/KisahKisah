"use client";

import { useState } from "react";
import { reportScoreAction } from "@/app/actions";
import { Notice, Submit, useKeptAction } from "./forms";

export function ReportScoreForm({ filmId, platforms }: { filmId: number; platforms: { id: string; name: string; scale: number; unit: string }[] }) {
  const [state, action, pending] = useKeptAction(reportScoreAction);
  const [pid, setPid] = useState(platforms[0]?.id ?? "");
  const p = platforms.find((x) => x.id === pid);
  return (
    <form onSubmit={action} className="grid gap-2 sm:grid-cols-[1fr_120px_2fr_auto]">
      <input type="hidden" name="film_id" value={filmId} />
      <select name="platform" className="input" value={pid} onChange={(e) => setPid(e.target.value)} aria-label="Platform">
        {platforms.map((x) => (
          <option key={x.id} value={x.id}>{x.name}</option>
        ))}
      </select>
      <div className="relative">
        <input name="value" type="number" step="0.1" min="0" max={p?.scale} className="input pr-12" placeholder="Score" required aria-label="Score" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{p?.scale === 100 ? (p.unit === "%" ? "%" : "/100") : p?.scale === 5 ? "/5" : "/10"}</span>
      </div>
      <input name="url" type="url" className="input" placeholder={`Link to the title on ${p?.name ?? "the platform"}`} required aria-label="Proof link" />
      <Submit pending={pending} className="btn btn-ghost">Report</Submit>
      <div className="sm:col-span-4">
        <Notice state={state} />
      </div>
    </form>
  );
}
