import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, userByUsername } from "@/lib/auth";
import { passport } from "@/lib/profile";
import { COUNTRIES, REGIONS, type RegionId } from "@/lib/regions";
import { countryCounts } from "@/lib/queries";

export const metadata: Metadata = { title: "Film Passport" };

const INK: Record<RegionId, string> = {
  sea: "#f5a524", east: "#ff6b6b", south: "#ff9f43", europe: "#6ea8ff", americas: "#4ade80", mea: "#e879f9", oceania: "#22d3ee",
};

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();

function tilt(code: string) {
  return ((code.charCodeAt(0) * 7 + code.charCodeAt(1) * 13) % 17) - 8;
}

export default async function PassportPage({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const isMe = viewer?.id === u.id;
  const stamps = passport(u.id);
  const available = countryCounts();
  const sea = COUNTRIES.filter((c) => c.region === "sea");
  const seaDone = sea.filter((c) => stamps.has(c.code)).length;
  const regionsDone = new Set([...stamps.keys()].map((c) => COUNTRIES.find((x) => x.code === c)?.region)).size;

  const goals = [
    { name: "ASEAN Explorer", need: "5 Southeast Asian stamps", have: seaDone, goal: 5, reward: "+120 KP" },
    { name: "One Vision, One Identity", need: "8 Southeast Asian stamps", have: seaDone, goal: 8, reward: "+300 KP · Batik" },
    { name: "Jalan-Jalan", need: "5 stamps anywhere", have: stamps.size, goal: 5, reward: "+60 KP" },
    { name: "Globetrotter", need: "Stamps from 4 world regions", have: regionsDone, goal: 4, reward: "+100 KP" },
    { name: "Around the World in 80 Films", need: "20 stamps anywhere", have: stamps.size, goal: 20, reward: "+400 KP" },
  ];

  return (
    <div className="space-y-6">
      <section className="passport-book p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#9fb0d6]">KisahKisah · Film Passport</div>
            <h2 className="font-display text-3xl font-extrabold">
              {stamps.size} {stamps.size === 1 ? "stamp" : "stamps"} · {seaDone} of {sea.length} Southeast Asian
            </h2>
            <p className="max-w-xl text-[#c4cde3]">
              {isMe ? "Your" : `${u.display_name}'s`} passport fills up as you watch. The first time you log a film or series from a new country, that country stamps the passport with the date and the title that got you there.
            </p>
          </div>
          <ol className="grid gap-2 text-sm text-[#c4cde3] sm:w-72">
            {["🎬 Watch a film or series from any country", "🛂 The first one stamps that country, with the date", "🏆 Collect stamps to unlock the goals below"].map((t, i) => (
              <li key={t} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron text-xs font-extrabold text-ink">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {goals.map((g) => {
            const done = g.have >= g.goal;
            return (
              <div key={g.name} className={`rounded-xl p-3 ${done ? "bg-jade/15 ring-1 ring-jade/50" : "bg-black/25"}`}>
                <div className="text-sm font-bold">{done ? "✓ " : ""}{g.name}</div>
                <div className="text-xs text-[#9fb0d6]">{g.need}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-saffron" style={{ width: `${Math.min(100, (g.have / g.goal) * 100)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[0.7rem] text-[#9fb0d6]">
                  <span>{Math.min(g.have, g.goal)}/{g.goal}</span>
                  <span>{g.reward}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {(Object.keys(REGIONS) as RegionId[]).map((r) => {
        const countries = COUNTRIES.filter((c) => c.region === r);
        const got = countries.filter((c) => stamps.has(c.code)).length;
        return (
          <section key={r} className="passport-book p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <h3 className="font-display text-xl font-extrabold">{REGIONS[r].icon} {REGIONS[r].name}</h3>
              <span className="text-sm text-[#9fb0d6]">{got} of {countries.length} stamped</span>
              {r === "sea" && <span className="rounded bg-saffron/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-saffron">Home region</span>}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {countries.map((c, i) => {
                const s = stamps.get(c.code);
                if (s?.first) {
                  return (
                    <Link
                      key={c.code}
                      href={`/film/${s.first.slug}`}
                      className={`stamp ${i % 3 === 1 ? "round" : ""}`}
                      style={{ ["--ink" as string]: INK[r], transform: `rotate(${tilt(c.code)}deg)` }}
                      title={`First entry: ${s.first.title}`}
                    >
                      <span className="text-3xl" style={{ mixBlendMode: "normal" }}>{c.flag}</span>
                      <span className="text-[0.7rem] font-extrabold uppercase tracking-widest">{c.name}</span>
                      <span className="font-mono text-[0.6rem] font-bold">ENTRY {fmt(s.first.date)}</span>
                      <span className="line-clamp-1 text-[0.6rem] italic opacity-90">{s.first.title}</span>
                      {s.titles > 1 && <span className="text-[0.6rem] font-bold opacity-80">× {s.titles} titles</span>}
                    </Link>
                  );
                }
                const n = available[c.code] ?? 0;
                return (
                  <Link key={c.code} href={`/films?country=${c.code}`} className="stamp-empty">
                    <span className="text-2xl opacity-40 grayscale">{c.flag}</span>
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider">{c.name}</span>
                    <span className="text-[0.6rem]">{n ? `${n} title${n > 1 ? "s" : ""} to stamp →` : "No titles yet"}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
