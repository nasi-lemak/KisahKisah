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
import { themeStyle } from "@/components/ui";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "KisahKisah · Every film has a kisah", template: "%s · KisahKisah" },
  description: "A social diary for films & series, with Southeast Asia in the spotlight and the whole world on the shelf. Log, review, collect, play.",
};

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/films", label: "Films & TV" },
  { href: "/lists", label: "Catalogues" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/kedai", label: "Kedai" },
  { href: "/cinemas", label: "Cinemas" },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const notes = user ? unseenNotifications(user.id) : [];
  const theme = user?.theme_item ? ITEM_BY_ID[user.theme_item]?.value : undefined;
  const live = activeEvents();
  const custom = syncCustomItems();

  return (
    <html lang="en">
      <body className="min-h-screen" data-theme={theme} style={themeStyle(user?.theme_item)}>
        <ItemRegistry items={custom} />
        <div className="batik-strip" />
        <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
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
                  {n.label}
                </Link>
              ))}
            </nav>
            <form action="/films" className="ml-auto hidden sm:block">
              <input name="q" placeholder="Cari filem… search films" className="input w-52 py-1.5 text-sm" aria-label="Search films" />
            </form>
            {user ? (
              <div className="ml-auto flex items-center gap-3 sm:ml-0">
                <Link href="/kedai" className="hidden sm:block" title="Your Kisah Points">
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
                      [`/u/${user.username}`, "Profile"],
                      [`/u/${user.username}/diary`, "Diary"],
                      [`/u/${user.username}/lists`, "My catalogues"],
                      [`/u/${user.username}/watchlist`, "Watchlist"],
                      ["/rewind", "⏪ My Rewind"],
                      ["/achievements", "Achievements"],
                      ["/studio", "🎨 Profile Studio"],
                      ...(user.role === "admin" || user.role === "staff" ? [["/admin", "🛠️ Admin"]] : []),
                      ["/settings", "Settings"],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} className="block rounded-md px-3 py-1.5 hover:bg-raised">
                        {label}
                      </Link>
                    ))}
                    <form action={logout}>
                      <button className="block w-full rounded-md px-3 py-1.5 text-left text-muted hover:bg-raised">Sign out</button>
                    </form>
                  </div>
                </details>
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2 sm:ml-0">
                <Link href="/login" className="btn btn-ghost py-1.5">Sign in</Link>
                <Link href="/register" className="btn btn-primary py-1.5">Join</Link>
              </div>
            )}
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="shrink-0 rounded-md bg-raised px-3 py-1 text-sm text-muted">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <EventBanner events={live} />

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:grid-cols-3">
            <div>
              <div className="font-display text-lg font-bold text-text">
                Kisah<span className="text-saffron">Kisah</span>
              </div>
              <p className="mt-2">
                <em>Kisah</em> (Malay): a story, a tale. Made in Southeast Asia for film & TV lovers everywhere. Selamat datang, welcome, 환영합니다, bienvenue.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/achievements" className="hover:text-text">Achievements</Link>
              <Link href="/community" className="hover:text-text">Leaderboard</Link>
              <Link href="/cinemas" className="hover:text-text">Cinema partners</Link>
              <Link href="/collections" className="hover:text-text">Trilogies & collections</Link>
              <Link href="/events" className="hover:text-text">Events calendar</Link>
              <Link href="/rewind" className="hover:text-text">Kisah Rewind</Link>
              <Link href="/about" className="hover:text-text">How points work</Link>
              <Link href="/advertise" className="hover:text-text">Advertise</Link>
            </div>
            <div>
              <p>Ratings live everywhere: Douban, Watcha, Filmarks, Letterboxd, IMDb. We link you to all of them.</p>
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
        <Toaster initial={notes} />
      </body>
    </html>
  );
}
