import { formatScore, scoresForFilm } from "@/lib/scores";
import { ReportScoreForm } from "./ReportScoreForm";

/** "Scores around the world": KisahKisah + other platforms, normalised to 0–100. */
export function ScoresPanel({
  film, signedIn,
}: {
  film: { id: number; country: string; avg_rating: number | null; log_count: number; title: string };
  signedIn: boolean;
}) {
  const s = scoresForFilm(film);
  const missing = s.platforms.filter((p) => p.value === null);
  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Scores around the world 🌏</h2>
          <p className="text-xs text-muted">Every score scaled to 100 so you can compare a Douban /10 with a Watcha ★ and a Rotten Tomatoes %.</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-muted">World score</div>
          <div className="font-display text-4xl font-bold text-saffron">{s.world ?? "–"}</div>
          <div className="text-[0.7rem] text-muted">{s.world ? `average of ${s.sources} sources` : "needs 2+ sources"}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Row name="KisahKisah" badge="KK" color="var(--color-saffron)" display={s.kisah ? `${s.kisah.value.toFixed(1)}★` : "–"} normalised={s.kisah?.normalised ?? null} note={s.kisah ? `${s.kisah.count} logs` : "no ratings yet"} />
        {s.platforms.map((p) => (
          <Row
            key={p.id}
            name={p.name}
            badge={p.badge}
            color={p.color}
            local={p.local}
            href={p.url}
            display={p.value === null ? "–" : formatScore(p.value, p.scale, p.unit)}
            normalised={p.normalised}
            note={p.source === "api" ? `synced${p.votes ? ` · ${p.votes.toLocaleString()} votes` : ""}` : p.source === "community" ? `${p.reports} member report${p.reports > 1 ? "s" : ""} · median` : "no data yet"}
          />
        ))}
      </div>

      {signedIn && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted hover:text-text">
            ＋ Know a score we&apos;re missing? Report it with a link (+2 KP){missing.length ? ` · ${missing.length} missing` : ""}
          </summary>
          <div className="mt-3">
            <ReportScoreForm filmId={film.id} platforms={s.platforms.map((p) => ({ id: p.id, name: p.name, scale: p.scale, unit: p.unit }))} />
          </div>
        </details>
      )}
    </section>
  );
}

function Row({ name, badge, color, display, normalised, note, href, local }: {
  name: string; badge: string; color: string; display: string; normalised: number | null; note: string; href?: string | null; local?: boolean;
}) {
  const label = (
    <span className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="font-semibold">{badge}</span>
      <span className="hidden text-muted sm:inline">{name}</span>
      {local && <span className="rounded bg-jade/15 px-1 text-[0.6rem] uppercase tracking-wider text-jade">local</span>}
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[220px_1fr_80px]">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-saffron">{label}</a>
      ) : (
        label
      )}
      <div className="order-3 col-span-2 h-2 overflow-hidden rounded bg-raised sm:order-none sm:col-span-1" title={note}>
        {normalised !== null && <div className="h-full rounded" style={{ width: `${normalised}%`, background: color }} />}
      </div>
      <div className="text-right">
        <div className="font-mono font-bold">{display}</div>
        <div className="text-[0.65rem] text-muted">{note}</div>
      </div>
    </div>
  );
}
