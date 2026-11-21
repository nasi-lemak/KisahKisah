import Link from "next/link";
import { ITEM_BY_ID, DEFAULT_AVATAR } from "@/lib/shop";
import { country } from "@/lib/regions";

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

type PosterFilm = { slug: string; title: string; year: number; country: string; motif: string };

export function Poster({ film, size = "md", link = true }: { film: PosterFilm; size?: "sm" | "md" | "lg"; link?: boolean }) {
  const [a, b] = posterColors(film.slug);
  const c = country(film.country);
  const motif = { sm: "text-3xl", md: "text-5xl", lg: "text-7xl" }[size];
  const title = { sm: "text-[0.65rem]", md: "text-sm", lg: "text-xl" }[size];
  const inner = (
    <div className="poster" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} title={`${film.title} (${film.year})`}>
      <div className="poster-pattern" />
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
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: av.bg, boxShadow: "inset 0 -4px 10px rgba(0,0,0,.25)" }}
    >
      <AvatarGlyph value={av.value} px={size} />
    </span>
  );
  if (!fr) return <span className="inline-flex shrink-0 rounded-full ring-1 ring-white/10">{face}</span>;
  return <span className={`avatar-frame ${fr.value}`}>{face}</span>;
}

export function UserChip({ u, size = 28 }: { u: { username: string; display_name: string; avatar_item: string; frame_item: string | null }; size?: number }) {
  return (
    <Link href={`/u/${u.username}`} className="inline-flex items-center gap-2 hover:text-saffron">
      <Avatar item={u.avatar_item} frame={u.frame_item} size={size} />
      <span className="font-semibold">{u.display_name}</span>
    </Link>
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
