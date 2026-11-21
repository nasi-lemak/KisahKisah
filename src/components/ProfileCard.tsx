import Link from "next/link";
import type { CardData } from "@/lib/profile";
import { ITEM_BY_ID } from "@/lib/shop";
import { country } from "@/lib/regions";
import { Avatar, LevelBadge, ProfileEffect, StyledName, bannerStyle } from "./ui";

/** Discord-Nitro-style profile card. Pure & client-safe: used for profiles, previews and hover cards. */
export function ProfileCard({ p, variant = "full", children }: { p: CardData; variant?: "full" | "mini"; children?: React.ReactNode }) {
  const banner = p.banner_item ? ITEM_BY_ID[p.banner_item]?.value ?? "" : "";
  const title = p.title_item ? ITEM_BY_ID[p.title_item]?.value : null;
  const c = country(p.home_country);
  const vars = {
    ["--p1" as string]: p.accent1 ?? "var(--color-saffron)",
    ["--p2" as string]: p.accent2 ?? "var(--color-jade)",
  } as React.CSSProperties;
  const mini = variant === "mini";

  return (
    <div className="profile-card shadow-2xl" style={vars}>
      <div className="inner">
        <div
          className={`banner ${banner} ${mini ? "h-20" : "h-40 sm:h-52"}`}
          style={banner ? bannerStyle(p.banner_item) : { background: "radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--p2) 70%, transparent), transparent 60%), linear-gradient(135deg, var(--p1), color-mix(in srgb, var(--p2) 60%, var(--color-ink)))" }}
        />
        <ProfileEffect effect={p.effect_item} count={mini ? 8 : 16} />
        <div className={`relative z-[4] ${mini ? "px-4 pb-4" : "px-5 pb-6 sm:px-7"}`}>
          <div className={`flex flex-wrap items-end gap-x-4 gap-y-2 ${mini ? "-mt-9" : "-mt-16"}`}>
            <span className="rounded-full p-1.5" style={{ background: "color-mix(in srgb, var(--p1) 22%, var(--color-ink))" }}>
              <Avatar item={p.avatar_item} frame={p.frame_item} size={mini ? 64 : 120} />
            </span>
            {!mini && p.badges.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1 rounded-xl bg-black/30 p-1 backdrop-blur" aria-label="Badges">
                {p.badges.map((b) => (
                  <span key={b.id} className="badge-pill" title={b.label}>
                    {b.icon}
                  </span>
                ))}
              </div>
            )}
            <div className="mb-2 ml-auto flex items-center gap-2" title={`${p.level.into}/${p.level.need} XP to level ${p.level.level + 1}`}>
              {!mini && (
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-muted">Level</div>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black/40">
                    <div className="h-full rounded-full" style={{ width: `${p.level.pct}%`, background: "linear-gradient(90deg, var(--p1), var(--p2))" }} />
                  </div>
                </div>
              )}
              <LevelBadge level={p.level.level} size={mini ? 30 : 46} />
            </div>
          </div>

          <div className={mini ? "mt-2" : "mt-3"}>
            <StyledName name={p.display_name} style={p.namestyle_item} className={`font-display font-extrabold leading-tight ${mini ? "text-xl" : "text-3xl sm:text-4xl"}`} />
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <span>@{p.username}</span>
              {c && <span>· {c.flag} {c.name}</span>}
              {!mini && <span>· since {new Date(`${p.since}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</span>}
            </div>
          </div>
          {title && (
            <div className="mt-2 inline-block rounded-md bg-black/30 px-2 py-0.5 text-sm font-semibold italic" style={{ color: "color-mix(in srgb, var(--p1) 70%, white)" }}>
              {title}
            </div>
          )}
          {mini && p.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.badges.slice(0, 7).map((b) => (
                <span key={b.id} className="badge-pill h-7 w-7 text-sm" title={b.label}>{b.icon}</span>
              ))}
            </div>
          )}
          {p.bio && (
            <div className={`mt-3 rounded-xl bg-black/25 p-3 text-sm ${mini ? "line-clamp-3" : ""}`}>
              {!mini && <div className="mb-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted">About me</div>}
              {p.bio}
            </div>
          )}
          {mini && (
            <Link href={`/u/${p.username}`} className="btn btn-ghost mt-3 w-full justify-center py-1.5 text-sm">View profile</Link>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
