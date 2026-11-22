import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { countryCounts, feedReviews, listFilms, popularReviews, recentLists } from "@/lib/queries";
import { COUNTRIES, REGIONS } from "@/lib/regions";
import { CHAINS } from "@/lib/cinema";
import { Poster, KP } from "@/components/ui";
import { ReviewCard } from "@/components/ReviewCard";
import { ListCard } from "@/components/ListCard";
import { CheckinButton } from "@/components/forms";
import { activeEvents, upcomingEvents } from "@/lib/events";
import { audience } from "@/lib/geo";
import { EventCard } from "@/components/EventBanner";

export default async function Home() {
  const user = await currentUser();
  const films = listFilms({ sort: "popular" });
  const sea = listFilms({ region: "sea", sort: "popular" }).slice(0, 12);
  const east = listFilms({ region: "east", sort: "rating" }).slice(0, 6);
  const world = listFilms({ sort: "popular" }).filter((f) => !["sea"].includes(COUNTRIES.find((c) => c.code === f.country)?.region ?? "")).slice(0, 6);
  const series = listFilms({ kind: "series", sort: "popular" }).slice(0, 6);
  const who = await audience();
  const live = activeEvents(undefined, who);
  const soon = upcomingEvents(undefined, 4 - Math.min(live.length, 4), who);
  const reviews = user ? feedReviews(user.id, 6) : [];
  const popular = popularReviews(6, user?.id ?? 0);
  const lists = recentLists(4);
  const counts = countryCounts();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#2a1607] via-surface to-[#062a20] p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-6 -top-6 grid grid-cols-4 gap-2 opacity-25 sm:opacity-40" aria-hidden>
          {films.slice(0, 8).map((f) => (
            <div key={f.id} className="w-20 rotate-6">
              <Poster film={f} size="sm" link={false} />
            </div>
          ))}
        </div>
        <div className="relative max-w-xl">
          {user ? (
            <>
              <p className="text-sm text-muted">Selamat kembali,</p>
              <h1 className="font-display text-4xl font-bold sm:text-5xl">{user.display_name} 👋</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <KP n={user.points} className="text-lg" />
                <CheckinButton done={user.last_checkin === today} />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/films" className="btn btn-primary">Log a film</Link>
                <Link href={`/u/${user.username}`} className="btn btn-ghost">My profile</Link>
                <Link href="/kedai" className="btn btn-ghost">Spend KP</Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
                Every film has a <span className="text-saffron">kisah</span>.
              </h1>
              <p className="mt-4 text-lg text-muted">
                Log the films and series you watch, compare scores from Douban to Rotten Tomatoes, collect avatars, play mini games and get your year back in Kisah Rewind.
                Southeast Asian cinema in the spotlight; the whole world on the shelf.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/register" className="btn btn-primary">Join free (+100 KP)</Link>
                <Link href="/films" className="btn btn-ghost">Browse films</Link>
              </div>
              <p className="mt-3 text-xs text-muted">Try the demo: sign in as <b>aisyah</b> / <b>kisah123</b></p>
            </>
          )}
        </div>
      </section>

      {/* Events */}
      <section>
        <div className="section-title flex items-baseline justify-between">
          <span>Events & limited drops</span>
          <Link href="/events" className="normal-case tracking-normal hover:text-text">Calendar →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {live.slice(0, 4).map((e) => (
            <EventCard key={e.id} e={e} note={`Live · ${e.daysLeft}d left`} />
          ))}
          {soon.map((e) => (
            <EventCard key={e.id} e={e} note={`In ${e.daysUntil} days`} />
          ))}
        </div>
      </section>

      {/* Around the world */}
      <section>
        <h2 className="section-title">Jalan-jalan · around the world</h2>
        <div className="flex flex-wrap gap-2">
          {COUNTRIES.filter((c) => counts[c.code]).map((c) => (
            <Link key={c.code} href={`/films?country=${c.code}`} className={`chip hover:border-saffron ${c.region === "sea" ? "" : "opacity-80"}`}>
              <span className="text-lg">{c.flag}</span> {c.name}
              <span className="text-muted">{counts[c.code]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title flex items-baseline justify-between">
          <span>Popular in {REGIONS.sea.name}</span>
          <Link href="/films?region=sea" className="normal-case tracking-normal hover:text-text">More →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {sea.map((f) => (
            <Poster key={f.id} film={f} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-title flex items-baseline justify-between">
          <span>Trending worldwide</span>
          <Link href="/films?sort=popular" className="normal-case tracking-normal hover:text-text">More →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {world.map((f) => (
            <Poster key={f.id} film={f} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="section-title flex items-baseline justify-between">
            <span>📺 Series to binge</span>
            <Link href="/films?kind=series" className="normal-case tracking-normal hover:text-text">All series →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {series.map((f) => (
              <Poster key={f.id} film={f} size="sm" />
            ))}
          </div>
        </div>
        <Link href={user ? "/rewind" : "/register"} className="card flex flex-col justify-between overflow-hidden p-5 story-bg-1 transition hover:brightness-110">
          <div>
            <div className="text-3xl">⏪</div>
            <h3 className="mt-1 font-display text-xl font-bold text-white">Kisah Rewind {new Date().getFullYear()}</h3>
            <p className="mt-1 text-sm text-white/85">Your year in films & series, story-style: top genres, countries, your film personality, and a card to share.</p>
          </div>
          <span className="mt-4 font-semibold text-white">{user ? "Play my Rewind →" : "Join to get yours →"}</span>
        </Link>
      </section>

      {reviews.length > 0 && (
        <section>
          <h2 className="section-title">From people you follow</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} r={r} viewerId={user?.id} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Popular reviews this week</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {popular.map((r) => (
            <ReviewCard key={r.id} r={r} viewerId={user?.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="section-title flex items-baseline justify-between">
            <span>Highest rated from {REGIONS.east.name}</span>
            <Link href="/films?region=east&sort=rating" className="normal-case tracking-normal hover:text-text">More →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-6">
            {east.map((f) => (
              <Poster key={f.id} film={f} size="sm" />
            ))}
          </div>
        </div>
        <div className="card flex flex-col justify-between p-5">
          <div>
            <div className="text-2xl">🎟️</div>
            <h3 className="mt-1 font-display text-xl font-bold">Points at the cinema</h3>
            <p className="mt-1 text-sm text-muted">
              Link your cinema membership or enter your e-ticket code to earn KP. Watch a local film in its home country for <b className="text-saffron">double points</b>.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {CHAINS.slice(0, 5).map((c) => (
              <span key={c.id} className="chip" style={{ borderColor: c.color }}>{c.name}</span>
            ))}
          </div>
          <Link href="/cinemas" className="btn btn-ghost mt-4 self-start">Link a cinema →</Link>
        </div>
      </section>

      <section>
        <div className="section-title flex items-baseline justify-between">
          <span>Catalogues by the community</span>
          <Link href="/lists" className="normal-case tracking-normal hover:text-text">All →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {lists.map((l) => (
            <ListCard key={l.id} l={l} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["🧩", "Mini games on reviews", "Reviewers hide quizzes, emoji riddles and arcade games on their pages. Win KP by playing.", "/community"],
          ["🎭", "Avatars, frames & banners", "Spend KP in the Kedai on Wayang Kulit avatars, Songket frames and more. Some can only be earned.", "/kedai"],
          ["🥚", "Secrets everywhere", "Some achievements are hidden. Some are very hidden. Have you tried clicking things?", "/achievements"],
        ].map(([icon, title, body, href]) => (
          <Link key={title} href={href} className="card p-5 transition hover:border-saffron/60">
            <div className="text-3xl">{icon}</div>
            <div className="mt-2 font-bold">{title}</div>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
