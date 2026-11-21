import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { followCounts, isFollowing, lifetimePoints } from "@/lib/queries";
import { one } from "@/lib/db";
import { country } from "@/lib/regions";
import { ITEM_BY_ID } from "@/lib/shop";
import { checkAchievements } from "@/lib/rewards";
import { Avatar, KP } from "@/components/ui";
import { toggleFollow } from "@/app/actions";

export default async function ProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ username: string }> }) {
  const { username } = await params;
  const u = userByUsername(username);
  if (!u) notFound();
  const viewer = await currentUser();
  if (viewer?.id === u.id) checkAchievements(u.id); // heal any missed unlocks

  const fc = followCounts(u.id);
  const following = viewer ? isFollowing(viewer.id, u.id) : false;
  const banner = u.banner_item ? ITEM_BY_ID[u.banner_item]?.value : "";
  const title = u.title_item ? ITEM_BY_ID[u.title_item]?.value : null;
  const c = country(u.home_country);
  const n = (sql: string) => one<{ n: number }>(sql, u.id)?.n ?? 0;
  const stats = [
    ["Films", n("SELECT COUNT(DISTINCT film_id) n FROM logs WHERE user_id = ?"), `/u/${u.username}/diary`],
    ["This year", n(`SELECT COUNT(*) n FROM logs WHERE user_id = ? AND watched_on >= '${new Date().getFullYear()}-01-01'`), `/u/${u.username}/diary`],
    ["Reviews", n("SELECT COUNT(*) n FROM reviews WHERE user_id = ?"), `/u/${u.username}/reviews`],
    ["Catalogues", n("SELECT COUNT(*) n FROM lists WHERE user_id = ?"), `/u/${u.username}/lists`],
    ["Followers", fc.followers, null],
    ["Following", fc.following, null],
  ] as const;
  const tabs = [
    ["", "Profile"], ["/diary", "Diary"], ["/reviews", "Reviews"], ["/lists", "Catalogues"], ["/watchlist", "Watchlist"],
  ];

  return (
    <div className="space-y-8">
      <div className="card overflow-hidden">
        <div className={`banner h-36 sm:h-44 ${banner}`} />
        <div className="relative px-6 pb-5">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <Avatar item={u.avatar_item} frame={u.frame_item} size={96} />
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="font-display text-3xl font-bold">{u.display_name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>@{u.username}</span>
                {c && <span>{c.flag} {c.name}</span>}
                {title && <span className="chip border-lotus/50 py-0 text-lotus">{title}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <div className="text-right text-xs text-muted">
                <KP n={lifetimePoints(u.id)} className="text-base" />
                <div>earned all-time</div>
              </div>
              {viewer && viewer.id !== u.id && (
                <form action={toggleFollow.bind(null, u.id)}>
                  <button className={`btn ${following ? "btn-ghost" : "btn-primary"}`}>{following ? "Following ✓" : "Follow"}</button>
                </form>
              )}
              {viewer?.id === u.id && (
                <Link href="/kedai/inventory" className="btn btn-ghost">Customise</Link>
              )}
            </div>
          </div>
          {u.bio && <p className="mt-4 max-w-2xl text-sm">{u.bio}</p>}
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {stats.map(([label, value, href]) => {
              const inner = (
                <>
                  <div className="font-display text-2xl font-bold">{value}</div>
                  <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
                </>
              );
              return href ? (
                <Link key={label} href={href} className="text-center hover:text-saffron">{inner}</Link>
              ) : (
                <div key={label} className="text-center">{inner}</div>
              );
            })}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line px-4">
          {tabs.map(([path, label]) => (
            <Link key={path} href={`/u/${u.username}${path}`} className="shrink-0 px-3 py-2.5 text-sm text-muted hover:text-text">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
