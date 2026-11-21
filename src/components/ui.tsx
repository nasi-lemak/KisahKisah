import Link from "next/link";
import { ITEM_BY_ID, DEFAULT_AVATAR } from "@/lib/shop";
import { country } from "@/lib/regions";
import { levelStyle } from "@/lib/levels";
import { ProfileHover } from "./ProfileHover";

/* ── Poster ───────────────────────────────────────────────── */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function posterColors(slug: string): [string, string] {
  const h = hash(slug);
  const hue = h % 360;
  const hue2 = (hue + 35 + ((h >> 9) % 80)) % 360;
  return [`hsl(${hue} 55% 32%)`, `hsl(${hue2} 65% 14%)`];
}

type PosterFilm = { slug: string; title: string; year: number; country: string; motif: string; kind?: string };

export function Poster({ film, size = "md", link = true }: { film: PosterFilm; size?: "sm" | "md" | "lg"; link?: boolean }) {
  const [a, b] = posterColors(film.slug);
  const c = country(film.country);
  const motif = { sm: "text-3xl", md: "text-5xl", lg: "text-7xl" }[size];
  const title = { sm: "text-[0.65rem]", md: "text-sm", lg: "text-xl" }[size];
  const inner = (
    <div className="poster" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} title={`${film.title} (${film.year})`}>
      <div className="poster-pattern" />
      {film.kind === "series" && (
        <div className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1 text-[0.55rem] font-bold uppercase tracking-wider text-white/90">Series</div>
      )}
      <div className={`absolute inset-0 flex items-center justify-center ${motif} drop-shadow-lg`} aria-hidden>
        {film.motif}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 pt-6">
        <div className={`font-display font-bold leading-tight ${title} line-clamp-2`}>{film.title}</div>
        {size !== "sm" && (
          <div className="mt-0.5 text-[0.7rem] text-white/70">
            {film.year} {c?.flag}
          </div>
        )}
      </div>
    </div>
  );
  return link ? (
    <Link href={`/film/${film.slug}`} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* ── Avatar ───────────────────────────────────────────────── */

export function Durian({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="durian" role="img">
      <path d="M32 6c2 0 3 3 3 5" stroke="#6b4f1d" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="38" rx="22" ry="20" fill="#9bbf2a" />
      {Array.from({ length: 22 }).map((_, i) => {
        const ang = (i / 22) * Math.PI * 2;
        const x = 32 + Math.cos(ang) * 20;
        const y = 38 + Math.sin(ang) * 18;
        return <path key={i} d={`M${x} ${y} l${Math.cos(ang) * 7} ${Math.sin(ang) * 7}`} stroke="#5d7a12" strokeWidth="5" strokeLinecap="round" />;
      })}
      {[[24, 32], [38, 30], [30, 44], [42, 44], [20, 44]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l3 -5 l3 5 z`} fill="#4d6610" />
      ))}
    </svg>
  );
}

export function AvatarGlyph({ value, px }: { value: string; px: number }) {
  if (value === "svg:durian") return <Durian size={px * 0.7} />;
  return <span style={{ fontSize: px * 0.55, lineHeight: 1 }}>{value}</span>;
}

export function Avatar({ item, frame, size = 40 }: { item?: string | null; frame?: string | null; size?: number }) {
  const av = ITEM_BY_ID[item ?? ""] ?? ITEM_BY_ID[DEFAULT_AVATAR];
  const fr = frame ? ITEM_BY_ID[frame] : null;
  const face = (
    <span
      className="face inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: av.bg, boxShadow: "inset 0 -4px 10px rgba(0,0,0,.25)" }}
    >
      <AvatarGlyph value={av.value} px={size} />
    </span>
  );
  if (!fr) return <span className="inline-flex shrink-0 rounded-full ring-1 ring-white/10">{face}</span>;
  const pad = Math.max(2, Math.round(size * 0.05));
  const orbit = fr.orbit ?? [];
  const r = size / 2 + pad + size * 0.08;
  return (
    <span className="deco" style={{ width: size + pad * 2, height: size + pad * 2 }}>
      {fr.ears && (
        <>
          <span className="deco-ear l" />
          <span className="deco-ear r" />
        </>
      )}
      <span className={`avatar-frame ${fr.value}`} style={{ padding: pad }}>{face}</span>
      {orbit.length > 0 && (
        <span className="deco-orbit" aria-hidden>
          {orbit.map((g, i) => {
            const a = (i / orbit.length) * 360;
            return (
              <span key={i} style={{ fontSize: size * 0.26, transform: `translate(-50%, -50%) rotate(${a}deg) translateY(${-r}px) rotate(${-a}deg)` }}>
                <AvatarGlyph value={g} px={size * 0.48} />
              </span>
            );
          })}
        </span>
      )}
      {fr.crown && (
        <span className="deco-crown" style={{ fontSize: size * 0.3 }} aria-hidden>
          <AvatarGlyph value={fr.crown} px={size * 0.55} />
        </span>
      )}
    </span>
  );
}

/** Display name with an equipped name style (gradient, neon, shimmer…). */
export function StyledName({ name, style, className = "" }: { name: string; style?: string | null; className?: string }) {
  const cls = style ? ITEM_BY_ID[style]?.value : undefined;
  return <span className={`${cls ?? ""} ${className}`}>{name}</span>;
}

/** A die-cut sticker, optionally animated. */
export function Sticker({ id, size = 40, animate = true, className = "" }: { id: string; size?: number; animate?: boolean; className?: string }) {
  const it = ITEM_BY_ID[id];
  if (!it) return null;
  return (
    <span className={`sticker ${className}`} title={it.name}>
      <span className={animate && it.anim ? `inline-flex st-${it.anim}` : "inline-flex"}>
        <AvatarGlyph value={it.value} px={size * 1.6} />
      </span>
    </span>
  );
}

/** Deterministic pseudo-random so server and client render the same particles. */
function prand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Discord-style profile effect: particles drifting over a card. */
export function ProfileEffect({ effect, count = 14 }: { effect?: string | null; count?: number }) {
  const it = effect ? ITEM_BY_ID[effect] : null;
  if (!it?.particles) return null;
  const motion = it.motion ?? "fall";
  return (
    <div className="fx-profile" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const g = it.particles![i % it.particles!.length];
        const left = prand(i, 1) * 100;
        const top = motion === "twinkle" || motion === "drift" ? prand(i, 2) * 90 : undefined;
        const dur = (motion === "streak" ? 1.2 : motion === "twinkle" ? 1.6 : 7) + prand(i, 3) * (motion === "streak" ? 1 : 5);
        const delay = -prand(i, 4) * dur;
        const size = 14 + prand(i, 5) * 14;
        const style: React.CSSProperties = { left: `${left}%`, top: top !== undefined ? `${top}%` : undefined, animationDuration: `${dur}s`, animationDelay: `${delay}s`, fontSize: size };
        if (g === "dot") return <span key={i} className={`fx-p fx-${motion} fx-dot`} style={style} />;
        if (g === "dash") return <span key={i} className={`fx-p fx-${motion} fx-dash`} style={style} />;
        return (
          <span key={i} className={`fx-p fx-${motion}`} style={style}>
            {g}
          </span>
        );
      })}
    </div>
  );
}

export function LevelBadge({ level, size = 36 }: { level: number; size?: number }) {
  const { shape, color, glow } = levelStyle(level);
  return (
    <span
      className={`level-badge ${shape} ${glow ? "glow" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ["--lv" as string]: color }}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}

export function UserChip({ u, size = 28 }: { u: { username: string; display_name: string; avatar_item: string; frame_item: string | null; namestyle_item?: string | null }; size?: number }) {
  return (
    <ProfileHover username={u.username}>
      <Link href={`/u/${u.username}`} className="inline-flex items-center gap-2 hover:brightness-125">
        <Avatar item={u.avatar_item} frame={u.frame_item} size={size} />
        <StyledName name={u.display_name} style={u.namestyle_item} className="font-semibold" />
      </Link>
    </ProfileHover>
  );
}

/* ── Stars ────────────────────────────────────────────────── */

export function Stars({ rating, className = "" }: { rating: number | null | undefined; className?: string }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className={`text-saffron tracking-tight ${className}`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      {half && "½"}
    </span>
  );
}

export function Flag({ code, withName = false }: { code: string; withName?: boolean }) {
  const c = country(code);
  if (!c) return null;
  return (
    <Link href={`/films?country=${c.code}`} className="hover:text-saffron" title={c.name}>
      {c.flag}
      {withName && <span className="ml-1">{c.name}</span>}
    </Link>
  );
}

export function timeAgo(iso: string): string {
  const t = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`).getTime();
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function KP({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-saffron ${className}`}>
      <span aria-hidden>🪙</span>
      {n.toLocaleString()} <span className="text-xs opacity-80">KP</span>
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card p-8 text-center text-muted">{children}</div>;
}
