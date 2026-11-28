"use client";

import { useRef, useState } from "react";
import type { CardData } from "@/lib/profile";
import { ProfileCard } from "./ProfileCard";
import { useLocale, useT } from "./I18n";

const cache = new Map<string, CardData>();

/** Hover (or focus) a user to see their mini profile card, Discord-style. */
export function ProfileHover({ username, children }: { username: string; children: React.ReactNode }) {
  const [card, setCard] = useState<CardData | null>(cache.get(username) ?? null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const t = useT();
  const locale = useLocale();

  const show = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setOpen(true);
      if (!cache.has(username)) {
        try {
          const res = await fetch(`/api/card/${encodeURIComponent(username)}`);
          if (res.ok) cache.set(username, await res.json());
        } catch {}
      }
      setCard(cache.get(username) ?? null);
    }, 350);
  };
  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {open && card && (
        <span className="toast-in absolute left-0 top-full z-50 mt-2 block w-[300px]" onMouseEnter={show} onMouseLeave={hide}>
          <ProfileCard p={card} variant="mini" t={t} locale={locale} />
        </span>
      )}
    </span>
  );
}
