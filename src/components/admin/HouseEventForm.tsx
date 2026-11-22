"use client";

import { useMemo, useState } from "react";
import { saveHouseEvent } from "@/app/admin/actions";
import { nextOccurrence, activeOccurrence, today, type SiteEvent } from "@/lib/events";
import { bonusLabel, houseToEvent, validateSchedule, type HouseEventRow } from "@/lib/workflow";
import { Notice, Submit, useKeptAction } from "../forms";

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function HouseEventForm({ initial, genres, countries }: { initial: HouseEventRow | null; genres: string[]; countries: { code: string; name: string; flag: string }[] }) {
  const [state, action, pending] = useKeptAction(saveHouseEvent);
  const y = new Date().getUTCFullYear();
  const toDate = (v: string | undefined, fallback: string) => (!v ? fallback : v.length === 5 ? `${y}-${v}` : v);
  const [v, setV] = useState({
    name: initial?.name ?? "", icon: initial?.icon ?? "🎉", tagline: initial?.tagline ?? "", color1: initial?.color1 ?? "#f5a524", color2: initial?.color2 ?? "#19b38a",
    repeat: initial?.repeat ?? "yearly", starts: toDate(initial?.starts, today()), ends: toDate(initial?.ends, today()),
    points: initial?.bonus_points ?? 10, genres: (initial?.bonus_genres ?? "").split(",").filter(Boolean), countries: (initial?.bonus_countries ?? "").split(",").filter(Boolean),
  });
  const starts = v.repeat === "yearly" ? v.starts.slice(5) : v.starts;
  const ends = v.repeat === "yearly" ? v.ends.slice(5) : v.ends;
  const problems = validateSchedule(v.repeat, starts, ends);
  const preview: SiteEvent | null = useMemo(() => {
    if (problems.length) return null;
    return houseToEvent({
      id: "preview", name: v.name || "Your event", icon: v.icon, tagline: v.tagline, blurb: "", color1: v.color1, color2: v.color2,
      repeat: v.repeat as "yearly" | "once", starts, ends, bonus_points: v.points, bonus_max: 3, bonus_genres: v.genres.join(","),
      bonus_countries: v.countries.join(","), featured: "", markets: "", enabled: 1,
    });
  }, [v, starts, ends, problems.length]);
  const now = preview ? activeOccurrence(preview, today()) : null;
  const next = preview ? nextOccurrence(preview, today()) : null;
  const toggle = (k: "genres" | "countries", x: string) => setV((s) => ({ ...s, [k]: s[k].includes(x) ? s[k].filter((y) => y !== x) : [...s[k], x] }));

  return (
    <form onSubmit={action} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <section className="glass space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_90px]">
            <div>
              <label className="label" htmlFor="he-name">Name</label>
              <input id="he-name" name="name" className="input" defaultValue={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required maxLength={60} placeholder="Hari Raya Haji" />
            </div>
            <div>
              <label className="label" htmlFor="he-icon">Icon</label>
              <input id="he-icon" name="icon" className="input text-center text-xl" defaultValue={v.icon} onChange={(e) => setV({ ...v, icon: e.target.value })} maxLength={8} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="he-tagline">Tagline (on the banner)</label>
            <input id="he-tagline" name="tagline" className="input" defaultValue={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} maxLength={140} />
          </div>
          <div>
            <label className="label" htmlFor="he-blurb">Description (on the event page)</label>
            <textarea id="he-blurb" name="blurb" className="input min-h-20" defaultValue={initial?.blurb ?? ""} maxLength={600} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="color" name="color1" defaultValue={v.color1} onChange={(e) => setV({ ...v, color1: e.target.value })} className="h-8 w-10 rounded border border-line bg-transparent" /> Main colour</label>
            <label className="flex items-center gap-2"><input type="color" name="color2" defaultValue={v.color2} onChange={(e) => setV({ ...v, color2: e.target.value })} className="h-8 w-10 rounded border border-line bg-transparent" /> Second colour</label>
            <label className="ml-auto flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={initial ? !!initial.enabled : true} /> Enabled</label>
          </div>
        </section>

        <section className="glass space-y-3 p-5">
          <h3 className="font-display font-bold">When</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            {[["yearly", "Every year (same dates)"], ["once", "One-off (e.g. this year's Hari Raya)"]].map(([k, l]) => (
              <label key={k} className={`chip cursor-pointer ${v.repeat === k ? "border-saffron text-saffron" : ""}`}>
                <input type="radio" name="repeat" value={k} checked={v.repeat === k} onChange={() => setV({ ...v, repeat: k as "yearly" | "once" })} className="sr-only" /> {l}
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="he-start">Starts{v.repeat === "yearly" ? " (year ignored)" : ""}</label>
              <input id="he-start" type="date" name="starts" className="input" value={v.starts} onChange={(e) => setV({ ...v, starts: e.target.value })} required />
            </div>
            <div>
              <label className="label" htmlFor="he-end">Ends{v.repeat === "yearly" ? " (may wrap into next year)" : ""}</label>
              <input id="he-end" type="date" name="ends" className="input" value={v.ends} onChange={(e) => setV({ ...v, ends: e.target.value })} required />
            </div>
          </div>
          {problems.length > 0 && <p className="text-sm text-red-300">{problems.join(" ")}</p>}
          <p className="text-xs text-muted">Lunar and Islamic holidays move every year: use a one-off event and add next year's when the date is confirmed.</p>
        </section>

        <section className="glass space-y-3 p-5">
          <h3 className="font-display font-bold">Logging bonus</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="he-points">Bonus KP per title (0 = none)</label>
              <input id="he-points" name="bonus_points" type="number" min={0} max={100} className="input" defaultValue={v.points} onChange={(e) => setV({ ...v, points: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label" htmlFor="he-max">Max titles per member</label>
              <input id="he-max" name="bonus_max" type="number" min={1} max={10} className="input" defaultValue={initial?.bonus_max ?? 3} />
            </div>
          </div>
          <fieldset>
            <legend className="label">For these genres…</legend>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <label key={g} className="chip cursor-pointer"><input type="checkbox" name="bonus_genres" value={g} checked={v.genres.includes(g)} onChange={() => toggle("genres", g)} /> {g}</label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">…or titles from these countries</legend>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((c) => (
                <label key={c.code} className="chip cursor-pointer"><input type="checkbox" name="bonus_countries" value={c.code} checked={v.countries.includes(c.code)} onChange={() => toggle("countries", c.code)} /> {c.flag} {c.code}</label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="glass space-y-3 p-5">
          <div>
            <label className="label" htmlFor="he-featured">Featured titles (slugs)</label>
            <input id="he-featured" name="featured" className="input" defaultValue={initial?.featured ?? ""} placeholder="mat-kilau-2022, ola-bola-2016" />
          </div>
          <fieldset>
            <legend className="label">Markets (leave empty for everywhere)</legend>
            <div className="flex flex-wrap gap-1.5">
              {countries.map((c) => (
                <label key={c.code} className="chip cursor-pointer"><input type="checkbox" name="markets" value={c.code} defaultChecked={(initial?.markets ?? "").split(",").includes(c.code)} /> {c.flag} {c.code}</label>
              ))}
            </div>
          </fieldset>
        </section>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">Preview</div>
        <div className="overflow-hidden rounded-xl border border-line text-sm" style={{ background: `linear-gradient(90deg, ${v.color1}33, ${v.color2}22)` }}>
          <div className="flex items-center gap-3 px-4 py-2">
            <span className="text-lg">{v.icon}</span><b>{v.name || "Your event"}</b><span className="truncate text-muted">{v.tagline}</span>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="flex h-20 items-center justify-center text-4xl" style={{ background: `linear-gradient(135deg, ${v.color1}, ${v.color2})` }}>{v.icon}</div>
          <div className="space-y-1 p-3 text-sm">
            <div className="font-bold">{v.name || "Your event"}</div>
            <div className="text-xs text-saffron">{now ? `Live now, until ${fmt(now.end)}` : next ? `Next: ${fmt(next.start)} → ${fmt(next.end)}` : "Pick valid dates"}</div>
            {v.points > 0 && (v.genres.length > 0 || v.countries.length > 0) && <div className="text-xs text-muted">🪙 +{v.points} KP: {bonusLabel(v.genres, v.countries)}</div>}
          </div>
        </div>
        <p className="text-xs text-muted">Attach limited items to this event from Admin → Items (“Where it's sold”).</p>
        <Notice state={state} />
        <Submit pending={pending}>{initial ? "Save event" : "Create event"}</Submit>
      </aside>
    </form>
  );
}
