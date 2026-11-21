"use client";

import { useEffect, useRef, useState } from "react";
import { markNotificationsSeen } from "@/app/actions";

export type Toast = { id: number | string; icon: string; title: string; body?: string; kind?: string };

/** Fire a toast from anywhere on the client. */
export function toast(t: Omit<Toast, "id">) {
  window.dispatchEvent(new CustomEvent("kk:toast", { detail: { ...t, id: `c${Math.random()}` } }));
}

export function Toaster({ initial }: { initial: Toast[] }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef(new Set<number | string>());

  const push = (items: Toast[]) => {
    const fresh = items.filter((t) => !seen.current.has(t.id));
    if (!fresh.length) return;
    fresh.forEach((t) => seen.current.add(t.id));
    setToasts((cur) => [...cur, ...fresh].slice(-5));
    fresh.forEach((t, i) => setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 5500 + i * 600));
  };

  // Server notifications arrive as props whenever the layout re-renders.
  useEffect(() => {
    push(initial);
    const ids = initial.map((t) => t.id).filter((id): id is number => typeof id === "number");
    if (ids.length) void markNotificationsSeen(ids);
  }, [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onToast = (e: Event) => push([(e as CustomEvent<Toast>).detail]);
    window.addEventListener("kk:toast", onToast);
    return () => window.removeEventListener("kk:toast", onToast);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in card flex items-start gap-3 p-3 shadow-2xl ${t.kind === "achievement" ? "border-saffron/70 bg-gradient-to-r from-[#2a1e08] to-surface" : ""}`}
        >
          <div className="text-2xl leading-none">{t.icon}</div>
          <div className="min-w-0">
            <div className="text-sm font-bold">{t.title}</div>
            {t.body && <div className="text-xs text-muted">{t.body}</div>}
          </div>
          <button className="ml-auto text-muted hover:text-text" onClick={() => setToasts((c) => c.filter((x) => x.id !== t.id))} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
