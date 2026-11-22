"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

type Metric = "impression" | "click" | "view";

/** Fire-and-forget, aggregated, no cookies. The server drops it for Do Not Track / GPC. */
export function track(eventId: string, metric: Metric) {
  try {
    const body = JSON.stringify({ e: eventId, m: metric });
    if (navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
  } catch {}
}

/** Counts an impression when the parent is at least half visible for a second, or a page view on mount. */
export function TrackOnView({ eventId, metric }: { eventId: string; metric: "impression" | "view" }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (metric === "view") {
      track(eventId, "view");
      return;
    }
    const target = ref.current?.parentElement;
    if (!target || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let done = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (done) return;
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            done = true;
            track(eventId, "impression");
            io.disconnect();
          }, 1000);
        } else if (timer) clearTimeout(timer);
      },
      { threshold: 0.5 },
    );
    io.observe(target);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [eventId, metric]);
  return <span ref={ref} hidden />;
}

export function TrackedLink({ eventId, href, className, style, children }: { eventId: string; href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <Link href={href} className={className} style={style} onClick={() => track(eventId, "click")}>
      {children}
    </Link>
  );
}
