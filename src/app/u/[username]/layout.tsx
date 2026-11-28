import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { followCounts, isFollowing } from "@/lib/queries";
import { one } from "@/lib/db";
import { ITEM_BY_ID } from "@/lib/shop";
import { checkAchievements } from "@/lib/rewards";
import { cardData } from "@/lib/profile";
import { ProfileCard } from "@/components/ProfileCard";
import { bannerStyle } from "@/components/ui";
import { toggleFollow } from "@/app/actions";
import { BlockButton, ReportButton } from "@/components/ReportButton";
import { hasBlocked } from "@/lib/moderation";
import { getI18n } from "@/lib/i18n/server";

export default async function ProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ username: string }> }) {
  const { username } = await params;
  const u = userByUsername(username);
  if (!u) notFound();
  const viewer = await currentUser();
  const { t, locale } = await getI18n();
  const standing = one<{ suspended_at: string | null; deleted_at: string | null }>("SELECT suspended_at, deleted_at FROM users WHERE id = ?", u.id)!;
  const staffViewer = viewer?.role === "staff" || viewer?.role === "admin";
  if (standing.deleted_at) notFound();
  if (standing.suspended_at && !staffViewer && viewer?.id !== u.id) {
    return <div className="glass mx-auto max-w-lg p-8 text-center"><div className="text-4xl">🛡️</div><p className="mt-2">{t("profile.suspendedNotice")}</p></div>;
  }
  const iBlocked = viewer && viewer.id !== u.id ? hasBlocked(viewer.id, u.id) : false;
  if (viewer?.id === u.id) checkAchievements(u.id); // heal any missed unlocks

  const card = cardData(u);
  const fc = followCounts(u.id);
  const following = viewer ? isFollowing(viewer.id, u.id) : false;
  const banner = u.banner_item ? ITEM_BY_ID[u.banner_item]?.value ?? "" : "";
  const n = (sql: string) => one<{ n: number }>(sql, u.id)?.n ?? 0;
  const year = new Date().getFullYear();
  const stats = [
    [t("profile.stat.titles"), n("SELECT COUNT(DISTINCT film_id) n FROM logs WHERE user_id = ?"), `/u/${u.username}/diary`],
    [String(year), n(`SELECT COUNT(*) n FROM logs WHERE user_id = ? AND watched_on >= '${year}-01-01'`), `/u/${u.username}/diary`],
    [t("profile.stat.reviews"), n("SELECT COUNT(*) n FROM reviews WHERE user_id = ?"), `/u/${u.username}/reviews`],
    [t("profile.stat.catalogues"), n("SELECT COUNT(*) n FROM lists WHERE user_id = ?"), `/u/${u.username}/lists`],
    [t("profile.stat.followers"), fc.followers, null],
    [t("profile.stat.following"), fc.following, null],
  ] as const;
  const tabs = [["", t("profile.tab.profile")], ["/diary", t("profile.tab.diary")], ["/reviews", t("profile.tab.reviews")], ["/lists", t("profile.tab.catalogues")], ["/watchlist", t("profile.tab.watchlist")], ["/passport", t("profile.tab.passport")]];
  const vars = { ["--p1" as string]: u.accent1 ?? "var(--color-saffron)", ["--p2" as string]: u.accent2 ?? "var(--color-jade)" } as React.CSSProperties;

  return (
    <div className="space-y-6" style={vars}>
      {/* Steam-style full-page profile background */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className={`banner ${banner} h-full w-full opacity-45`} style={banner ? bannerStyle(u.banner_item) : { background: "radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--p1) 35%, transparent), transparent 50%), radial-gradient(circle at 80% 30%, color-mix(in srgb, var(--p2) 30%, transparent), transparent 50%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/75 to-ink" />
      </div>

      <ProfileCard p={card} t={t} locale={locale}>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {stats.map(([label, value, href]) => {
            const inner = (
              <>
                <div className="font-display text-2xl font-extrabold">{value}</div>
                <div className="text-[0.65rem] font-bold uppercase tracking-widest text-muted">{label}</div>
              </>
            );
            return href ? (
              <Link key={label} href={href} className="rounded-xl bg-black/20 py-2 text-center transition hover:bg-black/35">{inner}</Link>
            ) : (
              <div key={label} className="rounded-xl bg-black/20 py-2 text-center">{inner}</div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {viewer && viewer.id !== u.id && (
            <form action={toggleFollow.bind(null, u.id)}>
              <button className={`btn ${following ? "btn-ghost" : "btn-primary"}`}>{following ? t("profile.followingBtn") : t("profile.follow")}</button>
            </form>
          )}
          {viewer?.id === u.id && <Link href="/studio" className="btn btn-primary">{t("profile.edit")}</Link>}
          <Link href={`/rewind/${u.username}/${year}`} className="btn btn-ghost">{t("profile.rewind", { year })}</Link>
          {viewer && viewer.id !== u.id && (
            <span className="ml-auto flex items-center gap-3">
              <BlockButton userId={u.id} name={u.display_name} initial={iBlocked} />
              <ReportButton type="user" id={u.id} signedIn label={t("profile.report")} />
            </span>
          )}
        </div>
        {standing.suspended_at && <p className="mt-3 rounded-md border border-chili/40 bg-chili/10 px-3 py-2 text-sm">{viewer?.id === u.id ? t("profile.suspendedSelf") : t("profile.suspended")}</p>}
      </ProfileCard>

      <nav className="glass flex gap-1 overflow-x-auto px-2">
        {tabs.map(([path, label]) => (
          <Link key={path} href={`/u/${u.username}${path}`} className="shrink-0 px-3 py-2.5 text-sm font-semibold text-muted hover:text-text">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
