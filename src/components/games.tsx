"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { playGame } from "@/app/actions";
import { StarInput } from "./LogForm";
import { rain } from "./EasterEggs";
import { toast } from "./Toaster";
import { Durian } from "./ui";

function drawDurian(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "#5d7a12";
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9);
    ctx.lineTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15);
    ctx.stroke();
  }
  ctx.fillStyle = "#9bbf2a";
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

type PublicGame =
  | { type: "trivia"; question: string; options: string[] }
  | { type: "guess_rating" }
  | { type: "emoji"; emojis: string; options: { id: number; title: string; year: number }[] }
  | { type: "popcorn"; target: number };

type Result = { won: boolean; score: number; points: number; message: string; reveal?: string | number };

const TITLES: Record<PublicGame["type"], [string, string]> = {
  trivia: ["❓", "Kuiz"],
  guess_rating: ["⭐", "Teka Bintang: guess the rating"],
  emoji: ["🧩", "Emoji Riddle"],
  popcorn: ["🍿", "Popcorn Catch"],
};

export function GamePanel({
  reviewId, game, author, previous, canPlay, signedIn, stats,
}: {
  reviewId: number;
  game: PublicGame;
  author: string;
  previous: { won: number; score: number } | null;
  canPlay: boolean;
  signedIn: boolean;
  stats: { plays: number; wins: number };
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const [icon, title] = TITLES[game.type];

  const submit = (answer: number) =>
    start(async () => {
      const r = await playGame(reviewId, answer);
      if ("error" in r) {
        toast({ icon: "⚠️", title: r.error });
        return;
      }
      setResult(r);
      if (r.won) rain(["🎉", "🍿", "⭐"], 30);
      if (r.points > 0) toast({ icon: "🪙", title: `+${r.points} KP`, body: r.message });
    });

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-raised/60 px-5 py-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-bold">{title}</div>
          <div className="text-xs text-muted">
            A mini game by {author} · {stats.plays} played · {stats.wins} won
          </div>
        </div>
      </div>
      <div className="p-5">
        {!signedIn ? (
          <p className="text-sm text-muted">
            <Link href={`/login?next=/review/${reviewId}`} className="font-semibold text-saffron">Sign in</Link> to play and win Kisah Points.
          </p>
        ) : !canPlay ? (
          <p className="text-sm text-muted">This is your game! Readers who play it can win KP. Share your review to get players.</p>
        ) : result ? (
          <ResultView result={result} game={game} />
        ) : previous ? (
          <p className="text-sm text-muted">
            You already played: {previous.won ? "🏆 won" : "lost"}
            {game.type === "popcorn" ? ` with ${previous.score} popcorn` : ""}. One go per review, no take-backs!
          </p>
        ) : (
          <GameBody game={game} pending={pending} onAnswer={submit} />
        )}
      </div>
    </section>
  );
}

function ResultView({ result, game }: { result: Result; game: PublicGame }) {
  let reveal: string | null = null;
  if (game.type === "trivia" && typeof result.reveal === "number") reveal = `Answer: ${game.options[result.reveal]}`;
  if (game.type === "guess_rating") reveal = `Their rating: ${"★".repeat(Math.floor(Number(result.reveal)))}${Number(result.reveal) % 1 ? "½" : ""}`;
  if (game.type === "emoji") reveal = `It was: ${game.options.find((o) => o.id === result.reveal)?.title ?? "?"}`;
  return (
    <div className="text-center">
      <div className="text-4xl">{result.won ? "🏆" : "😅"}</div>
      <div className="mt-2 text-lg font-bold">{result.message}</div>
      {reveal && <div className="mt-1 text-saffron">{reveal}</div>}
      <div className="mt-2 text-sm text-muted">{result.points > 0 ? `You earned ${result.points} KP.` : "No points this time."}</div>
    </div>
  );
}

function GameBody({ game, pending, onAnswer }: { game: PublicGame; pending: boolean; onAnswer: (n: number) => void }) {
  const [stars, setStars] = useState(0);
  switch (game.type) {
    case "trivia":
      return (
        <div>
          <p className="mb-3 font-semibold">{game.question}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {game.options.map((o, i) => (
              <button key={i} disabled={pending} onClick={() => onAnswer(i)} className="btn btn-ghost justify-start text-left">
                <span className="text-muted">{"ABCD"[i]}.</span> {o}
              </button>
            ))}
          </div>
        </div>
      );
    case "guess_rating":
      return (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted">How many stars did they give it? Exact = 10 KP, within ½ = 5 KP.</p>
          <StarInput name="guess" value={stars} onChange={setStars} />
          <button className="btn btn-primary" disabled={!stars || pending} onClick={() => onAnswer(stars)}>
            Lock in guess
          </button>
        </div>
      );
    case "emoji":
      return (
        <div className="text-center">
          <div className="mb-4 text-5xl tracking-widest">{game.emojis}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {game.options.map((o) => (
              <button key={o.id} disabled={pending} onClick={() => onAnswer(o.id)} className="btn btn-ghost justify-center">
                {o.title} <span className="text-muted">({o.year})</span>
              </button>
            ))}
          </div>
        </div>
      );
    case "popcorn":
      return <PopcornCatch target={game.target} onDone={onAnswer} />;
  }
}

/** 20 seconds. Catch 🍿 (+1) and ⭐ (+5), dodge durians (−3). Arrow keys, mouse or touch. */
export function PopcornCatch({ target, onDone }: { target: number; onDone: (score: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);

  useEffect(() => {
    if (phase !== "play") return;
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    let x = W / 2, raf = 0, last = performance.now(), spawn = 0, s = 0;
    const keys = new Set<string>();
    const items: { x: number; y: number; v: number; kind: "pop" | "star" | "durian" }[] = [];
    const end = performance.now() + 20000;

    const onKey = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) e.preventDefault();
      if (e.type === "keydown") keys.add(e.key);
      else keys.delete(e.key);
    };
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      x = ((e.clientX - r.left) / r.width) * W;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    c.addEventListener("pointermove", onMove);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (keys.has("ArrowLeft")) x -= 420 * dt;
      if (keys.has("ArrowRight")) x += 420 * dt;
      x = Math.max(30, Math.min(W - 30, x));
      spawn -= dt;
      if (spawn <= 0) {
        spawn = 0.28 + Math.random() * 0.25;
        const roll = Math.random();
        items.push({ x: 20 + Math.random() * (W - 40), y: -20, v: 120 + Math.random() * 140, kind: roll < 0.18 ? "durian" : roll < 0.24 ? "star" : "pop" });
      }
      ctx.clearRect(0, 0, W, H);
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.v * dt;
        if (it.y > H - 46 && it.y < H - 10 && Math.abs(it.x - x) < 36) {
          s = Math.max(0, s + (it.kind === "pop" ? 1 : it.kind === "star" ? 5 : -3));
          setScore(s);
          items.splice(i, 1);
          continue;
        }
        if (it.y > H + 20) {
          items.splice(i, 1);
          continue;
        }
        if (it.kind === "durian") drawDurian(ctx, it.x, it.y - 9);
        else ctx.fillText(it.kind === "pop" ? "🍿" : "⭐", it.x, it.y);
      }
      ctx.font = "40px serif";
      ctx.fillText("🪣", x, H - 14);
      const left = Math.max(0, Math.ceil((end - now) / 1000));
      setTime(left);
      if (now >= end) {
        setPhase("done");
        onDone(s);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      c.removeEventListener("pointermove", onMove);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span>🍿 <b>{score}</b> / {target}</span>
        <span className="flex items-center gap-1 text-muted"><Durian size={16} /> −3 · ⭐ +5</span>
        <span>⏱ {time}s</span>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-line bg-gradient-to-b from-[#1a1030] to-[#0e1014]">
        <canvas ref={canvas} width={560} height={320} className="block w-full touch-none" />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
            <p className="text-sm text-muted">Move with ← → or your mouse/finger. One attempt only!</p>
            <button className="btn btn-primary" onClick={() => setPhase("play")}>Start 🍿</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SpoilerText({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <div className={shown ? "" : "spoiler-blur"} onClick={() => setShown(true)} aria-hidden={!shown}>
        {children}
      </div>
      {!shown && (
        <button onClick={() => setShown(true)} className="btn btn-ghost absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl">
          ⚠️ Spoilers: tap to reveal
        </button>
      )}
    </div>
  );
}
