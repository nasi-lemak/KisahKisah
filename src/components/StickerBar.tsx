"use client";

import { useState, useTransition } from "react";
import { stickReview } from "@/app/actions";
import { Sticker } from "./ui";

type Sticker = { id: string; name: string; value: string };

/** Discord-style sticker reactions. One sticker per person per review. */
export function StickerBar({
  reviewId, summary, mine, owned, catalog, signedIn,
}: {
  reviewId: number;
  summary: { id: string; count: number }[];
  mine: string | null;
  owned: Sticker[];
  catalog: Record<string, Sticker>;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const stick = (id: string) =>
    start(async () => {
      await stickReview(reviewId, id);
      setOpen(false);
    });

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {summary.map((s) => {
        const st = catalog[s.id];
        if (!st) return null;
        const isMine = mine === s.id;
        return (
          <button
            key={s.id}
            title={`${st.name}${isMine ? " (yours, click to remove)" : ""}`}
            disabled={!signedIn || pending || (!isMine && !owned.some((o) => o.id === s.id))}
            onClick={() => stick(s.id)}
            className={`flex items-center gap-1.5 rounded-2xl border px-2 py-1 transition ${isMine ? "slap-in border-saffron bg-saffron/15" : "border-line bg-raised/60"}`}
          >
            <Sticker id={s.id} size={26} />
            <span className="text-xs font-bold">{s.count}</span>
          </button>
        );
      })}
      {signedIn && (
        <button className="chip py-0.5 text-xs text-muted hover:text-text" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          🏷️ {mine ? "Change sticker" : "Add sticker"}
        </button>
      )}
      {open && (
        <div className="glass absolute left-0 top-full z-30 mt-2 w-80 p-3 shadow-2xl">
          <div className="mb-2 text-xs text-muted">Your stickers. Get more from events and the Kedai.</div>
          <div className="grid grid-cols-5 gap-2">
            {owned.map((s) => (
              <button
                key={s.id}
                title={s.name}
                disabled={pending}
                onClick={() => stick(s.id)}
                className={`flex aspect-square items-center justify-center rounded-lg border transition hover:scale-110 ${mine === s.id ? "border-saffron bg-saffron/15" : "border-line bg-raised"}`}
              >
                <Sticker id={s.id} size={26} animate={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
