import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser, userByUsername } from "@/lib/auth";
import { passport } from "@/lib/profile";
import { COUNTRIES, REGIONS, type RegionId } from "@/lib/regions";
import { countryCounts } from "@/lib/queries";
import { getI18n } from "@/lib/i18n/server";
import { intlTag } from "@/lib/i18n/core";

export const metadata: Metadata = { title: "Film Passport" };

const INK: Record<RegionId, string> = {
  sea: "#f5a524", east: "#ff6b6b", south: "#ff9f43", europe: "#6ea8ff", americas: "#4ade80", mea: "#e879f9", oceania: "#22d3ee",
};

function tilt(code: string) {
  return ((code.charCodeAt(0) * 7 + code.charCodeAt(1) * 13) % 17) - 8;
}

export default async function PassportPage({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const { t, locale } = await getI18n();
  // Passport-stamp style ("05 NOV 2026"), in the viewer's language.
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase();
  const isMe = viewer?.id === u.id;
  const stamps = passport(u.id);
  const available = countryCounts();
  const sea = COUNTRIES.filter((c) => c.region === "sea");
  const seaDone = sea.filter((c) => stamps.has(c.code)).length;
  const regionOf = (code: string) => COUNTRIES.find((x) => x.code === code)?.region;
  const regionsDone = new Set([...stamps.keys()].map(regionOf)).size;
  const regionIds = Object.keys(REGIONS) as RegionId[];
  // The passport is global. Your home region (from your home country) comes first.
  const home = regionOf(u.home_country) ?? "sea";
  const order = [home, ...regionIds.filter((r) => r !== home)];
  const inRegion = (r: RegionId) => COUNTRIES.filter((c) => c.region === r);
  const stampedIn = (r: RegionId) => inRegion(r).filter((c) => stamps.has(c.code)).length;

  type Goal = { name: string; need: string; have: number; goal: number; reward: string };
  const goals: Goal[] = [
    { name: "Jalan-Jalan", need: t("profile.passport.needCountries", { n: 5 }), have: stamps.size, goal: 5, reward: "+60 KP" },
    { name: "Globetrotter", need: t("profile.passport.needRegions", { n: 4, total: 7 }), have: regionsDone, goal: 4, reward: "+100 KP" },
    { name: "Around the World in 80 Films", need: t("profile.passport.needCountries", { n: 20 }), have: stamps.size, goal: 20, reward: "+400 KP" },
  ];
  const bonus: Goal[] = [
    { name: "ASEAN Explorer", need: t("profile.passport.needSea", { n: 5 }), have: seaDone, goal: 5, reward: "+120 KP" },
    { name: "One Vision, One Identity", need: t("profile.passport.needSea", { n: 8 }), have: seaDone, goal: 8, reward: "+300 KP · Batik" },
  ];
  const GoalCard = ({ g }: { g: Goal }) => {
    const done = g.have >= g.goal;
    return (
      <div className={`rounded-xl p-3 ${done ? "bg-jade/15 ring-1 ring-jade/50" : "bg-black/25"}`}>
        <div className="text-sm font-bold">{done ? "✓ " : ""}{g.name}</div>
        <div className="text-xs text-[#9fb0d6]">{g.need}</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-saffron" style={{ width: `${Math.min(100, (g.have / g.goal) * 100)}%` }} />
        </div>
        <div className="mt-1 flex justify-between gap-2 text-[0.7rem] text-[#9fb0d6]">
          <span>{Math.min(g.have, g.goal)}/{g.goal}</span>
          <span>{g.reward}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="passport-book p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex-1 space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-[#9fb0d6]">{t("profile.passport.kicker")}</div>
            <h2 className="font-display text-3xl font-extrabold">
              {t("profile.passport.summary", { stamps: stamps.size, countries: COUNTRIES.length, regions: regionsDone, regionTotal: regionIds.length })}
            </h2>
            <p className="max-w-xl text-[#c4cde3]">
              {isMe ? t("profile.passport.blurbMe") : t("profile.passport.blurbThem", { name: u.display_name })}
            </p>
          </div>
          <ol className="grid gap-2 text-sm text-[#c4cde3] sm:w-72">
            {[t("profile.passport.step1"), t("profile.passport.step2"), t("profile.passport.step3")].map((step, i) => (
              <li key={step} className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron text-xs font-extrabold text-ink">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Region index: the passport's "contents page" */}
        <nav className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" aria-label={t("profile.stats.regions")}>
          {order.map((r) => {
            const got = stampedIn(r);
            const total = inRegion(r).length;
            return (
              <a key={r} href={`#region-${r}`} className={`rounded-xl p-3 transition hover:bg-black/40 ${r === home ? "bg-saffron/15 ring-1 ring-saffron/60" : "bg-black/25"}`}>
                <div className="text-xl">{REGIONS[r].icon}</div>
                <div className="text-xs font-bold leading-tight">{REGIONS[r].name}</div>
                <div className="text-[0.7rem] text-[#9fb0d6]">{got}/{total}{r === home ? ` · ${t("profile.passport.home")}` : ""}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-saffron" style={{ width: `${(got / total) * 100}%` }} />
                </div>
              </a>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[#9fb0d6]">{t("profile.passport.goals")}</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {goals.map((g) => <GoalCard key={g.name} g={g} />)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[#9fb0d6]">{t("profile.passport.bonus")}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {bonus.map((g) => <GoalCard key={g.name} g={g} />)}
            </div>
            <p className="mt-2 text-[0.7rem] text-[#9fb0d6]">{t("profile.passport.bonusNote")}</p>
          </div>
        </div>
      </section>

      {order.map((r) => {
        const countries = inRegion(r);
        const got = stampedIn(r);
        return (
          <section key={r} id={`region-${r}`} className="passport-book scroll-mt-24 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <h3 className="font-display text-xl font-extrabold">{REGIONS[r].icon} {REGIONS[r].name}</h3>
              <span className="text-sm text-[#9fb0d6]">{t("profile.passport.stamped", { got, total: countries.length })}</span>
              {r === home && <span className="rounded bg-saffron/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-saffron">{t("profile.passport.homeRegion")}</span>}
              {r === "sea" && r !== home && <span className="rounded bg-jade/20 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-jade">{t("profile.passport.spotlight")}</span>}
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
                      title={t("profile.passport.firstEntry", { title: s.first.title })}
                    >
                      <span className="text-3xl" style={{ mixBlendMode: "normal" }}>{c.flag}</span>
                      <span className="text-[0.7rem] font-extrabold uppercase tracking-widest">{c.name}</span>
                      <span className="font-mono text-[0.6rem] font-bold">{t("profile.passport.entry", { date: fmt(s.first.date) })}</span>
                      <span className="line-clamp-1 text-[0.6rem] italic opacity-90">{s.first.title}</span>
                      {s.titles > 1 && <span className="text-[0.6rem] font-bold opacity-80">{t("profile.passport.titles", { n: s.titles })}</span>}
                    </Link>
                  );
                }
                const n = available[c.code] ?? 0;
                return (
                  <Link key={c.code} href={`/films?country=${c.code}`} className="stamp-empty">
                    <span className="text-2xl opacity-40 grayscale">{c.flag}</span>
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider">{c.name}</span>
                    <span className="text-[0.6rem]">{n ? t(n > 1 ? "profile.passport.toStampMany" : "profile.passport.toStampOne", { n }) : t("profile.passport.noTitles")}</span>
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
