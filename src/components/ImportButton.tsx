"use client";

import { useTransition } from "react";
import { enrichCatalogue, importFromTmdb } from "@/app/catalog-actions";
import type { Kind } from "@/lib/tmdb-core";
import { toast } from "./Toaster";

export function ImportButton({ kind, id }: { kind: Kind; id: number }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button" className="btn btn-ghost py-1 text-xs" disabled={pending}
      onClick={() => start(async () => { const r = await importFromTmdb(kind, id); if (r?.error) toast({ icon: "⚠️", title: r.error }); })}
    >
      {pending ? "Adding…" : "＋ Add to KisahKisah"}
    </button>
  );
}

export function EnrichButton() {
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(async () => { const r = await enrichCatalogue(); toast({ icon: r?.error ? "⚠️" : "🎞️", title: r?.error ?? r?.ok ?? "Done" }); })}>
      {pending ? "Matching…" : "Match catalogue to TMDB"}
    </button>
  );
}
