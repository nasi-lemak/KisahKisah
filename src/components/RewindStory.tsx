"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { viewedRewind } from "@/app/actions";
import { Avatar, Poster } from "./ui";
import { rain } from "./EasterEggs";
import { toast } from "./Toaster";
import { useLocale, useT } from "./I18n";
import { Rich } from "./Rich";
import { intlTag, type Locale } from "@/lib/i18n/core";

type Title = { slug: string; title: string; year: number; country: string; motif: string; kind: string };
export type RewindData = {
  year: number; logs: number; titles: number; films: number; series: number; hours: number; hoursEstimated?: boolean; rewatches: number;
  reviews: number; likes: number; earned: number; achievements: number; cinemaTrips: number; midnight: number;
  avgRating: number | null;
  topGenres: { genre: string; count: number }[];
  countries: { code: string; flag: string; name: string; count: number }[];
  regions: number; seaShare: number;
  topDirector: { name: string; count: number } | null;
  topRated: (Title & { rating: number })[];
  first: Title | null; last: Title | null;
  months: number[]; busiestMonth: string | null; streak: number; topPercent: number | null;
  archetype: { id: string; name: string; emoji: string; blurb: string };
};

type T = ReturnType<typeof useT>;

/** Month name (or its initial) in the viewer's language. */
const monthName = (locale: Locale, month: number, style: "long" | "narrow") =>
  new Date(Date.UTC(2000, month, 1)).toLocaleString(intlTag(locale), { month: style, timeZone: "UTC" });
const SLIDE_MS = 7000;

export function RewindStory({ d, who, isOwner, shareUrl }: {
  d: RewindData;
  who: { display_name: string; username: string; avatar_item: string; frame_item: string | null };
  isOwner: boolean;
  shareUrl: string;
}) {
  const t = useT();
  const locale = useLocale();
  const slides = buildSlides(d, who, t, locale);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const last = slides.length - 1;

  const go = useCallback((n: number) => setI(Math.max(0, Math.min(last, n))), [last]);

  useEffect(() => {
    if (isOwner) void viewedRewind();
  }, [isOwner]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!paused && i < last) timer.current = setTimeout(() => go(i + 1), SLIDE_MS);
    if (i === slides.length - 2) rain(["🎉", "⭐", "🍿", "🎬"], 40);
    return () => clearTimeout(timer.current);
  }, [i, paused, go, last, slides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go]);

  return (
    <div className="mx-auto max-w-md">
      <div
        className={`story-bg-${i % 8} relative aspect-[9/16] w-full select-none overflow-hidden rounded-3xl shadow-2xl`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* progress */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {slides.map((_, k) => (
            <div key={k} className="story-bar h-1 flex-1 overflow-hidden rounded bg-white/25">
              {k < i && <span className="block h-full w-full bg-white" style={{ animation: "none" }} />}
              {k === i && (
                <span
                  key={`${i}-${paused}`}
                  className="block h-full bg-white"
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused || i === last ? "paused" : "running", width: i === last ? "100%" : undefined }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="absolute left-4 top-7 z-20 flex items-center gap-2 text-xs font-semibold text-white/85">
          <Avatar item={who.avatar_item} frame={who.frame_item} size={22} /> {who.display_name} · {t("rewind.badge", { year: d.year })}
        </div>

        <div key={i} className="absolute inset-0 flex flex-col justify-center px-7 pt-12 text-white">
          {slides[i]}
        </div>

        {/* tap zones */}
        {i < last && (
          <>
            <button aria-label={t("rewind.prev")} className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => go(i - 1)} />
            <button aria-label={t("rewind.next")} className="absolute inset-y-0 right-0 z-10 w-2/3" onClick={() => go(i + 1)} />
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="hover:text-text disabled:opacity-30">{t("rewind.back")}</button>
        <span>{t("rewind.progress", { i: i + 1, n: slides.length })}</span>
        <button onClick={() => go(i + 1)} disabled={i === last} className="hover:text-text disabled:opacity-30">{t("rewind.forward")}</button>
      </div>

      {i === last && <ShareTools d={d} who={who} shareUrl={shareUrl} t={t} />}
    </div>
  );
}

function Big({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-display text-7xl font-bold leading-none ${className}`}>{children}</div>;
}

function buildSlides(d: RewindData, who: { display_name: string }, t: T, locale: Locale): React.ReactNode[] {
  const s: React.ReactNode[] = [];
  const busiest = d.months.indexOf(Math.max(...d.months));
  s.push(
    <div className="text-center">
      <div className="story-pop text-7xl">⏪</div>
      <div className="story-pop-2 mt-4 text-sm uppercase tracking-[0.3em] text-white/70">{t("rewind.kicker")}</div>
      <Big className="story-pop-2 mt-2">{d.year}</Big>
      <p className="story-pop-3 mt-6 text-lg">{t("rewind.intro", { name: who.display_name })}</p>
    </div>,
  );
  s.push(
    <div>
      <p className="story-pop text-lg">{t("rewind.logged")}</p>
      <Big className="story-pop-2 my-3">{d.titles}</Big>
      <p className="story-pop-2 text-2xl font-bold">{t("rewind.titles")}</p>
      <p className="story-pop-3 mt-6 text-lg text-white/85">
        {t(d.films === 1 ? "rewind.filmsOne" : "rewind.filmsMany", { n: d.films })} · {t("rewind.series", { n: d.series })}
        <br />{t("rewind.hours", { n: d.hours })}
        {d.rewatches > 0 && <><br />{t(d.rewatches === 1 ? "rewind.rewatchesOne" : "rewind.rewatchesMany", { n: d.rewatches })}</>}
      </p>
      <p className="mt-8 text-xs text-white/50">{d.hoursEstimated ? t("rewind.hoursEstimated") : t("rewind.hoursReal")}</p>
    </div>,
  );
  if (d.topGenres[0]) {
    s.push(
      <div>
        <p className="story-pop text-lg">{t("rewind.topGenre")}</p>
        <Big className="story-pop-2 my-4 text-6xl">{d.topGenres[0].genre}</Big>
        <ol className="story-pop-3 mt-6 space-y-2 text-xl">
          {d.topGenres.map((g, k) => (
            <li key={g.genre} className="flex justify-between border-b border-white/20 pb-1">
              <span>{k + 1}. {g.genre}</span>
              <span className="text-white/70">{g.count}</span>
            </li>
          ))}
        </ol>
      </div>,
    );
  }
  s.push(
    <div>
      <p className="story-pop text-lg">{t("rewind.stamped")}</p>
      <Big className="story-pop-2 my-3">{d.countries.length}</Big>
      <p className="story-pop-2 text-2xl font-bold">{t(d.countries.length === 1 ? "rewind.countryOne" : "rewind.countryMany")} {t(d.regions === 1 ? "rewind.regionsOne" : "rewind.regionsMany", { n: d.regions })}</p>
      <div className="story-pop-3 mt-6 flex flex-wrap gap-2 text-4xl">
        {d.countries.slice(0, 15).map((c) => (
          <span key={c.code} title={`${c.name}: ${c.count}`}>{c.flag}</span>
        ))}
      </div>
      <p className="story-pop-3 mt-6 text-white/85">
        {d.seaShare >= 50 ? t("rewind.seaHigh", { pct: d.seaShare }) : d.seaShare > 0 ? t("rewind.seaSome", { pct: d.seaShare }) : t("rewind.seaNone")}
      </p>
    </div>,
  );
  if (d.topDirector && d.topDirector.count > 1) {
    s.push(
      <div>
        <p className="story-pop text-lg">{t("rewind.director")}</p>
        <div className="story-pop-2 my-5 font-display text-5xl font-bold leading-tight">{d.topDirector.name}</div>
        <p className="story-pop-3 text-xl">{t("rewind.directorCount", { n: d.topDirector.count })}</p>
      </div>,
    );
  }
  if (d.topRated.length) {
    s.push(
      <div>
        <p className="story-pop text-lg">{t("rewind.topRated", { year: d.year })}</p>
        <div className="story-pop-2 mx-auto my-5 w-40">
          <Poster film={d.topRated[0]} link={false} />
        </div>
        <p className="story-pop-2 text-center font-display text-2xl font-bold">{d.topRated[0].title}</p>
        <p className="text-center text-saffron">{"★".repeat(Math.floor(d.topRated[0].rating))}{d.topRated[0].rating % 1 ? "½" : ""}</p>
        <div className="story-pop-3 mt-4 grid grid-cols-4 gap-2">
          {d.topRated.slice(1, 5).map((r) => (
            <Poster key={r.slug} film={r} size="sm" link={false} />
          ))}
        </div>
      </div>,
    );
  }
  const max = Math.max(1, ...d.months);
  s.push(
    <div>
      <p className="story-pop text-lg">{t("rewind.busiest")}</p>
      <Big className="story-pop-2 my-3 text-6xl">{d.busiestMonth ? monthName(locale, busiest, "long") : "–"}</Big>
      <div className="story-pop-3 mt-6 flex h-36 items-end gap-1.5">
        {d.months.map((m, k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-white/85" style={{ height: `${(m / max) * 100}%`, minHeight: m ? 6 : 2, opacity: m ? 1 : 0.3 }} />
            <span className="text-[0.65rem] text-white/70">{monthName(locale, k, "narrow")}</span>
          </div>
        ))}
      </div>
      <p className="story-pop-3 mt-6 text-lg"><Rich text={t("rewind.streak")} nodes={{ days: <b>{t(d.streak === 1 ? "rewind.daysOne" : "rewind.daysMany", { n: d.streak })}</b> }} /></p>
    </div>,
  );
  s.push(
    <div>
      <p className="story-pop mb-6 text-lg">{t("rewind.beyond")}</p>
      <div className="story-pop-2 grid grid-cols-2 gap-4">
        {[
          ["✍️", d.reviews, t("rewind.stat.reviews")],
          ["❤️", d.likes, t("rewind.stat.likes")],
          ["🎟️", d.cinemaTrips, t("rewind.stat.cinema")],
          ["🪙", d.earned, t("rewind.stat.kp")],
          ["🏆", d.achievements, t("rewind.stat.achievements")],
          ["🌙", d.midnight, t("rewind.stat.midnight")],
        ].map(([icon, n, label]) => (
          <div key={String(label)} className="rounded-2xl bg-black/25 p-4">
            <div className="text-2xl">{icon}</div>
            <div className="font-display text-3xl font-bold">{Number(n).toLocaleString()}</div>
            <div className="text-xs text-white/75">{label}</div>
          </div>
        ))}
      </div>
    </div>,
  );
  s.push(
    <div className="text-center">
      <p className="story-pop text-lg">{t("rewind.personality", { year: d.year })}</p>
      <div className="story-pop-2 my-4 text-8xl">{d.archetype.emoji}</div>
      <div className="story-pop-2 font-display text-4xl font-bold">{d.archetype.name}</div>
      <p className="story-pop-3 mt-4 text-lg text-white/90">{d.archetype.blurb}</p>
      {d.topPercent && <p className="story-pop-3 mt-6 inline-block rounded-full bg-black/30 px-4 py-1.5 text-sm">{t("rewind.topPercent", { pct: d.topPercent })}</p>}
    </div>,
  );
  s.push(
    <div className="text-center">
      <div className="text-6xl">{d.archetype.emoji}</div>
      <div className="mt-2 font-display text-3xl font-bold">{d.archetype.name}</div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div><div className="font-display text-3xl font-bold">{d.titles}</div><div className="text-xs text-white/75">{t("rewind.titles")}</div></div>
        <div><div className="font-display text-3xl font-bold">{d.countries.length}</div><div className="text-xs text-white/75">{t("rewind.countries")}</div></div>
        <div><div className="font-display text-3xl font-bold">{d.hours}</div><div className="text-xs text-white/75">{t("rewind.hoursShort")}</div></div>
      </div>
      {d.topGenres[0] && <p className="mt-4"><Rich text={t("rewind.topGenreIs")} nodes={{ genre: <b>{d.topGenres[0].genre}</b> }} /></p>}
      {d.topRated[0] && <p><Rich text={t("rewind.favourite")} nodes={{ title: <b>{d.topRated[0].title}</b> }} /></p>}
      <div className="mt-4 text-2xl">{d.countries.slice(0, 8).map((c) => c.flag).join(" ")}</div>
      <p className="mt-6 text-sm text-white/70">kisahkisah · {t("rewind.badge", { year: d.year })}</p>
    </div>,
  );
  return s;
}

function ShareTools({ d, who, shareUrl, t }: { d: RewindData; who: { display_name: string }; shareUrl: string; t: T }) {
  const download = async () => {
    const c = document.createElement("canvas");
    c.width = 1080;
    c.height = 1920;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 1080, 1920);
    g.addColorStop(0, "#2a1607");
    g.addColorStop(0.5, "#171a21");
    g.addColorStop(1, "#062a20");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#f5a524";
    ctx.fillRect(0, 0, 1080, 18);
    ctx.textAlign = "center";
    const text = (str: string, y: number, size: number, color = "#ece8e1", font = "Georgia, serif", weight = "bold") => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.fillText(str, 540, y, 980);
    };
    text(t("rewind.canvasKicker"), 160, 44, "#f5a524", "system-ui, sans-serif");
    text(String(d.year), 300, 150);
    text(who.display_name, 390, 56, "#ece8e1", "system-ui, sans-serif", "600");
    text(d.archetype.emoji, 610, 180, "#fff", "sans-serif", "normal");
    text(d.archetype.name, 740, 76);
    const stats: [string, string][] = [[String(d.titles), t("rewind.titles")], [String(d.countries.length), t("rewind.countries")], [`≈${d.hours}`, t("rewind.hoursWord")]];
    stats.forEach(([n, l], k) => {
      const x = 220 + k * 320;
      ctx.fillStyle = "#ece8e1";
      ctx.font = "bold 110px Georgia, serif";
      ctx.fillText(n, x, 960);
      ctx.fillStyle = "#9aa1ad";
      ctx.font = "36px system-ui, sans-serif";
      ctx.fillText(l, x, 1015);
    });
    if (d.topGenres[0]) text(t("rewind.topGenreIs", { genre: d.topGenres[0].genre }), 1150, 48, "#ece8e1", "system-ui, sans-serif", "600");
    d.topRated.slice(0, 3).forEach((r, k) => text(`${k + 1}. ${r.title}`, 1260 + k * 70, 44, "#ece8e1", "system-ui, sans-serif", "normal"));
    text(d.countries.slice(0, 10).map((x) => x.flag).join(" "), 1560, 70, "#fff", "sans-serif", "normal");
    text(t("rewind.canvasTagline"), 1820, 34, "#9aa1ad", "system-ui, sans-serif", "normal");
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `kisah-rewind-${d.year}.png`;
    a.click();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ icon: "🔗", title: t("rewind.copied"), body: t("rewind.copiedBody") });
    } catch {
      toast({ icon: "🔗", title: shareUrl });
    }
  };
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button className="btn btn-primary" onClick={download}>{t("rewind.download")}</button>
      <button className="btn btn-ghost" onClick={copy}>{t("rewind.copy")}</button>
      <Link href="/films" className="btn btn-ghost">{t("rewind.nextYear")}</Link>
    </div>
  );
}
