"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { viewedRewind } from "@/app/actions";
import { Avatar, Poster } from "./ui";
import { rain } from "./EasterEggs";
import { toast } from "./Toaster";

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

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const SLIDE_MS = 7000;

export function RewindStory({ d, who, isOwner, shareUrl }: {
  d: RewindData;
  who: { display_name: string; username: string; avatar_item: string; frame_item: string | null };
  isOwner: boolean;
  shareUrl: string;
}) {
  const slides = buildSlides(d, who);
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
          <Avatar item={who.avatar_item} frame={who.frame_item} size={22} /> {who.display_name} · Rewind {d.year}
        </div>

        <div key={i} className="absolute inset-0 flex flex-col justify-center px-7 pt-12 text-white">
          {slides[i]}
        </div>

        {/* tap zones */}
        {i < last && (
          <>
            <button aria-label="Previous" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => go(i - 1)} />
            <button aria-label="Next" className="absolute inset-y-0 right-0 z-10 w-2/3" onClick={() => go(i + 1)} />
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <button onClick={() => go(i - 1)} disabled={i === 0} className="hover:text-text disabled:opacity-30">← Back</button>
        <span>{i + 1} / {slides.length} · tap or use ← →</span>
        <button onClick={() => go(i + 1)} disabled={i === last} className="hover:text-text disabled:opacity-30">Next →</button>
      </div>

      {i === last && <ShareTools d={d} who={who} shareUrl={shareUrl} />}
    </div>
  );
}

function Big({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-display text-7xl font-bold leading-none ${className}`}>{children}</div>;
}

function buildSlides(d: RewindData, who: { display_name: string }): React.ReactNode[] {
  const s: React.ReactNode[] = [];
  s.push(
    <div className="text-center">
      <div className="story-pop text-7xl">⏪</div>
      <div className="story-pop-2 mt-4 text-sm uppercase tracking-[0.3em] text-white/70">Kisah Rewind</div>
      <Big className="story-pop-2 mt-2">{d.year}</Big>
      <p className="story-pop-3 mt-6 text-lg">{who.display_name}, every film you watched told a kisah. Let&apos;s play yours back.</p>
    </div>,
  );
  s.push(
    <div>
      <p className="story-pop text-lg">This year you logged</p>
      <Big className="story-pop-2 my-3">{d.titles}</Big>
      <p className="story-pop-2 text-2xl font-bold">titles</p>
      <p className="story-pop-3 mt-6 text-lg text-white/85">
        🎬 {d.films} film{d.films === 1 ? "" : "s"} · 📺 {d.series} series
        <br />≈ {d.hours} hours in front of a screen*
        {d.rewatches > 0 && <><br />🔁 and {d.rewatches} comfort rewatch{d.rewatches === 1 ? "" : "es"}</>}
      </p>
      <p className="mt-8 text-xs text-white/50">{d.hoursEstimated ? "*real runtimes where we have them, otherwise 2h per film and 8h per season" : "*from each title's runtime"}</p>
    </div>,
  );
  if (d.topGenres[0]) {
    s.push(
      <div>
        <p className="story-pop text-lg">Your top genre was</p>
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
      <p className="story-pop text-lg">Your passport got stamped in</p>
      <Big className="story-pop-2 my-3">{d.countries.length}</Big>
      <p className="story-pop-2 text-2xl font-bold">countr{d.countries.length === 1 ? "y" : "ies"} across {d.regions} region{d.regions === 1 ? "" : "s"}</p>
      <div className="story-pop-3 mt-6 flex flex-wrap gap-2 text-4xl">
        {d.countries.slice(0, 15).map((c) => (
          <span key={c.code} title={`${c.name}: ${c.count}`}>{c.flag}</span>
        ))}
      </div>
      <p className="story-pop-3 mt-6 text-white/85">
        {d.seaShare >= 50 ? `🌺 ${d.seaShare}% Southeast Asian. Sokong filem tempatan!` : d.seaShare > 0 ? `🌺 ${d.seaShare}% from Southeast Asia` : "Next year: try a film from Southeast Asia? 🌺"}
      </p>
    </div>,
  );
  if (d.topDirector && d.topDirector.count > 1) {
    s.push(
      <div>
        <p className="story-pop text-lg">The filmmaker you kept coming back to</p>
        <div className="story-pop-2 my-5 font-display text-5xl font-bold leading-tight">{d.topDirector.name}</div>
        <p className="story-pop-3 text-xl">{d.topDirector.count} titles this year. Maybe write them a fan letter?</p>
      </div>,
    );
  }
  if (d.topRated.length) {
    s.push(
      <div>
        <p className="story-pop text-lg">Your highest-rated of {d.year}</p>
        <div className="story-pop-2 mx-auto my-5 w-40">
          <Poster film={d.topRated[0]} link={false} />
        </div>
        <p className="story-pop-2 text-center font-display text-2xl font-bold">{d.topRated[0].title}</p>
        <p className="text-center text-saffron">{"★".repeat(Math.floor(d.topRated[0].rating))}{d.topRated[0].rating % 1 ? "½" : ""}</p>
        <div className="story-pop-3 mt-4 grid grid-cols-4 gap-2">
          {d.topRated.slice(1, 5).map((t) => (
            <Poster key={t.slug} film={t} size="sm" link={false} />
          ))}
        </div>
      </div>,
    );
  }
  const max = Math.max(1, ...d.months);
  s.push(
    <div>
      <p className="story-pop text-lg">Your busiest month was</p>
      <Big className="story-pop-2 my-3 text-6xl">{d.busiestMonth ?? "–"}</Big>
      <div className="story-pop-3 mt-6 flex h-36 items-end gap-1.5">
        {d.months.map((m, k) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-white/85" style={{ height: `${(m / max) * 100}%`, minHeight: m ? 6 : 2, opacity: m ? 1 : 0.3 }} />
            <span className="text-[0.65rem] text-white/70">{MONTHS[k]}</span>
          </div>
        ))}
      </div>
      <p className="story-pop-3 mt-6 text-lg">🔥 Longest streak: <b>{d.streak} day{d.streak === 1 ? "" : "s"}</b> in a row</p>
    </div>,
  );
  s.push(
    <div>
      <p className="story-pop mb-6 text-lg">Beyond the screen</p>
      <div className="story-pop-2 grid grid-cols-2 gap-4">
        {[
          ["✍️", d.reviews, "reviews"],
          ["❤️", d.likes, "likes received"],
          ["🎟️", d.cinemaTrips, "cinema trips"],
          ["🪙", d.earned, "KP earned"],
          ["🏆", d.achievements, "achievements"],
          ["🌙", d.midnight, "after-midnight logs"],
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
      <p className="story-pop text-lg">Your {d.year} film personality</p>
      <div className="story-pop-2 my-4 text-8xl">{d.archetype.emoji}</div>
      <div className="story-pop-2 font-display text-4xl font-bold">{d.archetype.name}</div>
      <p className="story-pop-3 mt-4 text-lg text-white/90">{d.archetype.blurb}</p>
      {d.topPercent && <p className="story-pop-3 mt-6 inline-block rounded-full bg-black/30 px-4 py-1.5 text-sm">Top {d.topPercent}% most active members</p>}
    </div>,
  );
  s.push(
    <div className="text-center">
      <div className="text-6xl">{d.archetype.emoji}</div>
      <div className="mt-2 font-display text-3xl font-bold">{d.archetype.name}</div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div><div className="font-display text-3xl font-bold">{d.titles}</div><div className="text-xs text-white/75">titles</div></div>
        <div><div className="font-display text-3xl font-bold">{d.countries.length}</div><div className="text-xs text-white/75">countries</div></div>
        <div><div className="font-display text-3xl font-bold">{d.hours}</div><div className="text-xs text-white/75">≈ hours</div></div>
      </div>
      {d.topGenres[0] && <p className="mt-4">Top genre: <b>{d.topGenres[0].genre}</b></p>}
      {d.topRated[0] && <p>Favourite: <b>{d.topRated[0].title}</b></p>}
      <div className="mt-4 text-2xl">{d.countries.slice(0, 8).map((c) => c.flag).join(" ")}</div>
      <p className="mt-6 text-sm text-white/70">kisahkisah · Rewind {d.year}</p>
    </div>,
  );
  return s;
}

function ShareTools({ d, who, shareUrl }: { d: RewindData; who: { display_name: string }; shareUrl: string }) {
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
    const text = (t: string, y: number, size: number, color = "#ece8e1", font = "Georgia, serif", weight = "bold") => {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px ${font}`;
      ctx.fillText(t, 540, y, 980);
    };
    text("KISAH REWIND", 160, 44, "#f5a524", "system-ui, sans-serif");
    text(String(d.year), 300, 150);
    text(who.display_name, 390, 56, "#ece8e1", "system-ui, sans-serif", "600");
    text(d.archetype.emoji, 610, 180, "#fff", "sans-serif", "normal");
    text(d.archetype.name, 740, 76);
    const stats: [string, string][] = [[String(d.titles), "titles"], [String(d.countries.length), "countries"], [`≈${d.hours}`, "hours"]];
    stats.forEach(([n, l], k) => {
      const x = 220 + k * 320;
      ctx.fillStyle = "#ece8e1";
      ctx.font = "bold 110px Georgia, serif";
      ctx.fillText(n, x, 960);
      ctx.fillStyle = "#9aa1ad";
      ctx.font = "36px system-ui, sans-serif";
      ctx.fillText(l, x, 1015);
    });
    if (d.topGenres[0]) text(`Top genre: ${d.topGenres[0].genre}`, 1150, 48, "#ece8e1", "system-ui, sans-serif", "600");
    d.topRated.slice(0, 3).forEach((t, k) => text(`${k + 1}. ${t.title}`, 1260 + k * 70, 44, "#ece8e1", "system-ui, sans-serif", "normal"));
    text(d.countries.slice(0, 10).map((x) => x.flag).join(" "), 1560, 70, "#fff", "sans-serif", "normal");
    text("Every film has a kisah · kisahkisah", 1820, 34, "#9aa1ad", "system-ui, sans-serif", "normal");
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `kisah-rewind-${d.year}.png`;
    a.click();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ icon: "🔗", title: "Link copied!", body: "Share your Rewind anywhere." });
    } catch {
      toast({ icon: "🔗", title: shareUrl });
    }
  };
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button className="btn btn-primary" onClick={download}>⬇️ Download share card</button>
      <button className="btn btn-ghost" onClick={copy}>🔗 Copy link</button>
      <Link href="/films" className="btn btn-ghost">Start next year&apos;s kisah</Link>
    </div>
  );
}
