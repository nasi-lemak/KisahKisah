"use client";

import { useEffect, useRef, useState } from "react";
import { discover, rain } from "@/components/EasterEggs";
import { toast } from "@/components/Toaster";

const N = 7;
const MENU = [
  ["Kopi O Kosong", "A film with no score. Bold, bitter, honest.", "RM 1.80"],
  ["Teh Tarik", "Pulled for 120 minutes, like a Ramadan epic.", "RM 2.20"],
  ["Kopi C Peng", "An iced rom-com. Sweet, milky, gone too fast.", "RM 2.50"],
  ["Milo Dinosaur", "A sequel with way too much of everything.", "RM 4.50"],
  ["Roti Bakar Kaya", "The comfort rewatch. Always golden.", "RM 2.00"],
  ["Telur Separuh Masak", "The ambiguous ending. Runny, divisive, perfect.", "RM 2.40"],
];

const UNCLE = [
  "Aiyo, you also here? Sit, sit. Kopi or teh?",
  "Last time cinema got intermission one. Now all rush rush.",
  "My favourite film? The one I watched with my wife at Rex in '78. Cannot remember title, but I remember her.",
  "You young people, always rating rating. Just watch lah.",
  "Wah, you found the lanterns? Light all seven, see what happens.",
  "Ola Bola I watched three times. Three times I cried. Don't tell my son.",
];

/** Seven lanterns. Each tap toggles itself and its neighbours. Light them all. */
export function Kopitiam() {
  const [lit, setLit] = useState<boolean[]>([false, true, false, false, true, false, false]);
  const [uncle, setUncle] = useState(0);
  const [moves, setMoves] = useState(0);
  const solved = useRef(false);

  useEffect(() => {
    void discover("egg_kopitiam", "Kopitiam Regular", "You found the secret kopitiam. Uncle saved you a seat.", "☕");
  }, []);

  const tap = (i: number) => {
    if (solved.current) return;
    const next = lit.map((v, j) => (Math.abs(i - j) <= 1 ? !v : v));
    setLit(next);
    setMoves((m) => m + 1);
    if (next.every(Boolean)) {
      solved.current = true;
      rain(["🏮", "✨", "🥮"], 40);
      void discover("egg_lantern", "Lantern Keeper", `All seven lanterns lit in ${moves + 1} taps. Happy Mid-Autumn!`, "🏮");
    }
  };

  const reset = () => {
    solved.current = false;
    setLit([false, true, false, false, true, false, false]);
    setMoves(0);
  };

  return (
    <div className="space-y-10">
      <div className="card overflow-hidden">
        <div className="flex justify-around bg-gradient-to-b from-[#2a0a0a] to-surface px-4 pb-6 pt-2">
          {lit.map((on, i) => (
            <button key={i} onClick={() => tap(i)} className={`lantern text-4xl sm:text-5xl ${on ? "lit" : ""}`} aria-label={`Lantern ${i + 1} ${on ? "lit" : "unlit"}`} style={{ marginTop: (i % 2) * 18 }}>
              🏮
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between px-5 py-2 text-xs text-muted">
          <span>Taps: {moves}</span>
          <button onClick={reset} className="hover:text-text">reset</button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="card p-6" style={{ background: "repeating-linear-gradient(0deg, #1b2a1f 0 36px, #1d2e22 36px 37px)" }}>
          <h2 className="text-center font-display text-2xl font-bold text-saffron">MENU · 菜单 · மெனு</h2>
          <ul className="mt-4 space-y-3">
            {MENU.map(([name, desc, price]) => (
              <li key={name} className="flex items-baseline gap-3">
                <button className="font-semibold hover:text-saffron" onClick={() => toast({ icon: "☕", title: `One ${name}, coming up!`, body: desc })}>
                  {name}
                </button>
                <span className="flex-1 border-b border-dotted border-muted/40" />
                <span className="font-mono text-sm">{price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-xs text-muted">All prices since 1965. Cash only. No outside durians.</p>
        </div>
        <div className="card flex flex-col p-5">
          <div className="text-5xl">👴🏻</div>
          <div className="mt-2 font-bold">Uncle Lim</div>
          <p className="mt-2 flex-1 text-sm italic">&ldquo;{UNCLE[uncle]}&rdquo;</p>
          <button className="btn btn-ghost mt-4 self-start" onClick={() => setUncle((u) => (u + 1) % UNCLE.length)}>
            Chat more
          </button>
        </div>
      </div>
    </div>
  );
}
