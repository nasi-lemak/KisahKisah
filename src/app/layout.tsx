import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { currentUser } from "@/lib/auth";
import { unseenNotifications } from "@/lib/queries";
import { Avatar, KP } from "@/components/ui";
import { Toaster } from "@/components/Toaster";
import { EasterEggs, LogoEgg } from "@/components/EasterEggs";
import { logout } from "./actions";
import { ITEM_BY_ID } from "@/lib/shop";
import { activeEvents } from "@/lib/events";
import { EventBanner } from "@/components/EventBanner";
import { ItemRegistry } from "@/components/ItemRegistry";
import { syncCustomItems } from "@/lib/custom-items";
import { audience } from "@/lib/geo";
import { artistProfile, orgsForUser } from "@/lib/portal";
import { themeStyle } from "@/components/ui";
import { getLocale, getT } from "@/lib/i18n/server";
import { MESSAGES } from "@/lib/i18n/messages";
import { I18nProvider } from "@/components/I18n";
import { LanguagePicker } from "@/components/LanguagePicker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "KisahKisah · Every film has a kisah", template: "%s · KisahKisah" },
  description: "A social diary for films & series, with Southeast Asia in the spotlight and the whole world on the shelf. Log, review, collect, play.",
};

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/films", key: "nav.films" },
  { href: "/lists", key: "nav.lists" },
  { href: "/community", key: "nav.community" },
  { href: "/events", key: "nav.events" },
  { href: "/kedai", key: "nav.kedai" },
  { href: "/cinemas", key: "nav.cinemas" },
] as const;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const notes = user ? unseenNotifications(user.id) : [];
  const theme = user?.theme_item ? ITEM_BY_ID[user.theme_item]?.value : undefined;
  const live = activeEvents(undefined, await audience());
  const custom = syncCustomItems();
  const locale = await getLocale();
  const t = await getT();

  return (
    <html lang={locale === "tl" ? "fil" : locale}>
      <body className="min-h-screen" data-theme={theme} style={themeStyle(user?.theme_item)}>
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
        <ItemRegistry items={custom} />
        <div className="batik-strip" />
        <header className="sticky top-0 z-40 border-b print:hidden border-line bg-ink/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
              <LogoEgg />
              <span>
                Kisah<span className="text-saffron">Kisah</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-raised hover:text-text">
                  {t(n.key)}
                </Link>
              ))}
            </nav>
            <form action="/films" className="ml-auto hidden sm:block">
              <input name="q" placeholder={t("search.placeholder")} className="input w-52 py-1.5 text-sm" aria-label={t("search.label")} />
            </form>
            {user ? (
              <div className="ml-auto flex items-center gap-3 sm:ml-0">
                <Link href="/kedai" className="hidden sm:block" title={t("kp.title")}>
                  <KP n={user.points} className="text-sm" />
                </Link>
                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center">
                    <Avatar item={user.avatar_item} frame={user.frame_item} size={34} />
                  </summary>
                  <div className="card absolute right-0 mt-2 w-52 overflow-hidden p-1 text-sm shadow-2xl">
                    <div className="px-3 py-2">
                      <div className="font-semibold">{user.display_name}</div>
                      <KP n={user.points} className="text-xs" />
                    </div>
                    {[
                      [`/u/${user.username}`, t("menu.profile")],
                      [`/u/${user.username}/diary`, t("menu.diary")],
                      [`/u/${user.username}/lists`, t("menu.lists")],
                      [`/u/${user.username}/watchlist`, t("menu.watchlist")],
                      ["/rewind", t("menu.rewind")],
                      ["/achievements", t("menu.achievements")],
                      ["/studio", t("menu.studio")],
                      ...(user.role === "admin" || user.role === "staff" ? [["/admin", t("menu.admin")]] : []),
                      ...(orgsForUser(user.id).length ? [["/partner", t("menu.partner")]] : []),
                      ...(artistProfile(user.id)?.status === "approved" ? [["/artists", t("menu.artist")]] : []),
                      ["/settings", t("menu.settings")],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} className="block rounded-md px-3 py-1.5 hover:bg-raised">
                        {label}
                      </Link>
                    ))}
                    <form action={logout}>
                      <button className="block w-full rounded-md px-3 py-1.5 text-left text-muted hover:bg-raised">{t("menu.signout")}</button>
                    </form>
                  </div>
                </details>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2 sm:ml-0">
                <Link href="/login" className="btn btn-ghost py-1.5">{t("auth.signin")}</Link>
                <Link href="/register" className="btn btn-primary py-1.5">{t("auth.join")}</Link>
              </div>
            )}
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 rounded-md bg-raised px-3 py-1 text-sm text-muted">
                {t(n.key)}
              </Link>
            ))}
          </nav>
        </header>
        <div className="print:hidden"><EventBanner events={live} /></div>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-line print:hidden">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-3">
            <div>
              <div className="font-display text-lg font-bold text-text">
                Kisah<span className="text-saffron">Kisah</span>
              </div>
              <p className="mt-2">{t("footer.tagline")} Selamat datang, welcome, 환영합니다, bienvenue.</p>
              <div className="mt-4"><LanguagePicker current={locale} label={t("lang.label")} /></div>
              {locale !== "en" && <p className="mt-1 text-xs">{t("lang.note")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/achievements" className="hover:text-text">{t("footer.achievements")}</Link>
              <Link href="/community" className="hover:text-text">{t("footer.leaderboard")}</Link>
              <Link href="/cinemas" className="hover:text-text">{t("footer.cinemas")}</Link>
              <Link href="/collections" className="hover:text-text">{t("footer.collections")}</Link>
              <Link href="/events" className="hover:text-text">{t("footer.events")}</Link>
              <Link href="/rewind" className="hover:text-text">{t("footer.rewind")}</Link>
              <Link href="/about" className="hover:text-text">{t("footer.points")}</Link>
              <Link href="/advertise" className="hover:text-text">{t("footer.advertise")}</Link>
              <Link href="/artists" className="hover:text-text">{t("footer.artists")}</Link>
              <Link href="/partner" className="hover:text-text">{t("footer.partner")}</Link>
            </div>
            <div>
              <p>{t("footer.ratings")}</p>
              <p className="mt-2 text-xs">Posters and title data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
              <p className="mt-3 flex items-center gap-2">
                © {new Date().getFullYear()} KisahKisah
                <Link href="/kopitiam" aria-label="." className="opacity-20 transition-opacity hover:opacity-100" title="kopi?">
                  ☕
                </Link>
              </p>
            </div>
          </div>
          <div id="credits-sentinel" className="h-2" />
        </footer>

        <EasterEggs />
        </I18nProvider>
        <Toaster initial={notes} />
      </body>
    </html>
  );
}
