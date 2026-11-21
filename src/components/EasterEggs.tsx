"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { foundEgg } from "@/app/actions";
import { toast } from "./Toaster";
import { Durian } from "./ui";

/**
 * Hidden fun, sitewide. Spoilers for the curious:
 *  - ↑ ↑ ↓ ↓ ← → ← → B A           → confetti + Cheat Code Champion
 *  - click the logo 7 times quickly → durian rain
 *  - type "makan" anywhere          → a feast falls from the sky
 *  - scroll to the footer and wait  → post-credits scene
 *  - log in between 00:00 and 04:00 → the site goes midnight blue
 *  - there's a kopitiam somewhere…
 */

type Drop = { id: number; left: number; delay: number; dur: number; glyph: string; size: number };

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const FOODS = ["🍛", "🍜", "🍢", "🥟", "🍚", "🥭", "🍤", "🧋", "🍡", "🥥"];
const CONFETTI = ["🎉", "✨", "🎊", "⭐", "🎬", "🍿"];

export function rain(glyphs: string[], count = 40) {
  window.dispatchEvent(new CustomEvent("kk:rain", { detail: { glyphs, count } }));
}

export async function discover(egg: string, title: string, body: string, icon: string) {
  const res = await foundEgg(egg);
  if (!res.ok) return;
  if (!res.signedIn) toast({ icon, title, body: `${body} Sign in to claim the hidden achievement!` });
  else if (res.new) toast({ icon, title: `Secret found: ${title}`, body, kind: "achievement" });
  else toast({ icon, title, body: "You've already found this one. 😉" });
}

export function EasterEggs() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [credits, setCredits] = useState(false);
  const router = useRouter();
  const seq = useRef<string[]>([]);
  const typed = useRef("");
  const nextId = useRef(0);

  const makeItRain = useCallback((glyphs: string[], count = 40) => {
    const fresh = Array.from({ length: count }, () => ({
      id: nextId.current++,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      dur: 2.2 + Math.random() * 2,
      glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
      size: 20 + Math.random() * 26,
    }));
    setDrops((d) => [...d, ...fresh]);
    setTimeout(() => setDrops((d) => d.filter((x) => !fresh.includes(x))), 5000);
  }, []);

  useEffect(() => {
    const onRain = (e: Event) => {
      const { glyphs, count } = (e as CustomEvent<{ glyphs: string[]; count: number }>).detail;
      makeItRain(glyphs, count);
    };
    window.addEventListener("kk:rain", onRain);
    return () => window.removeEventListener("kk:rain", onRain);
  }, [makeItRain]);

  // Konami code + "makan"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      seq.current = [...seq.current, key].slice(-KONAMI.length);
      if (seq.current.join() === KONAMI.join()) {
        seq.current = [];
        makeItRain(CONFETTI, 60);
        void discover("egg_konami", "Cheat Code Champion", "+30 lives. Just kidding. Enjoy your new avatar.", "🎮");
      }
      if (key.length === 1) {
        typed.current = (typed.current + key).slice(-12);
        if (typed.current.endsWith("makan")) {
          typed.current = "";
          makeItRain(FOODS, 45);
          void discover("egg_makan", "Sudah Makan?", "Have you eaten? The most loving question in Asia.", "🍛");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [makeItRain]);

  // Midnight mode
  useEffect(() => {
    const h = new Date().getHours();
    document.body.classList.toggle("midnight", h < 4);
  }, []);

  // Post-credits scene: footer must stay on screen for 6 seconds
  useEffect(() => {
    const el = document.getElementById("credits-sentinel");
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([entry]) => {
      // Only on pages you actually had to scroll through, once per visit.
      const scrolled = window.scrollY > 300 && document.documentElement.scrollHeight > window.innerHeight * 1.5;
      let shown = false;
      try {
        shown = sessionStorage.getItem("kk:credits") === "1";
      } catch {}
      if (entry.isIntersecting && scrolled && !shown) {
        timer = setTimeout(() => {
          try {
            sessionStorage.setItem("kk:credits", "1");
          } catch {}
          setCredits(true);
          void discover("egg_credits", "Post-Credits Scene", "You stayed till the end. Marvel would be proud.", "🎬");
        }, 6000);
      } else if (timer) clearTimeout(timer);
    }, { threshold: 1 });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="fx-layer" aria-hidden>
        {drops.map((d) => (
          <span key={d.id} className="fx-drop" style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, fontSize: d.size }}>
            {d.glyph === "durian" ? <Durian size={d.size * 1.2} /> : d.glyph}
          </span>
        ))}
      </div>
      {credits && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/90 p-6" onClick={() => setCredits(false)}>
          <div className="max-w-md text-center">
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-muted">post-credits scene</div>
            <p className="font-display text-2xl leading-relaxed">
              Somewhere in a kopitiam, a lone uncle sips his kopi-o and whispers:
              <br />
              <span className="text-saffron">&ldquo;The real kisah was the friends we made along the way.&rdquo;</span>
            </p>
            <button className="btn btn-ghost mt-6" onClick={() => router.push("/kopitiam")}>
              Follow the uncle ☕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** The logo: harmless, unless you click it seven times in a row. */
export function LogoEgg() {
  const clicks = useRef<number[]>([]);
  const onClick = () => {
    const now = Date.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 2500), now];
    if (clicks.current.length >= 7) {
      clicks.current = [];
      rain(["durian"], 35);
      void discover("egg_durian", "Durian Whisperer", "The King of Fruits has blessed you. (Your neighbours have not.)", "🌧️");
    }
  };
  return (
    <span onClick={onClick} className="wiggle inline-block select-none" role="presentation">
      📽️
    </span>
  );
}
