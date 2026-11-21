import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { cinemaLinks, listFilms, purchases } from "@/lib/queries";
import { CHAINS, CHAIN_BY_ID, LOCAL_FILM_BONUS, MAX_POINTS_PER_TICKET } from "@/lib/cinema";
import { COUNTRY_BY_CODE, country } from "@/lib/regions";
import { DemoBoxOffice, LinkCinemaForm, RedeemForm, SignInPrompt } from "@/components/forms";
import { unlinkCinema } from "@/app/actions";
import { timeAgo } from "@/components/ui";

export const metadata: Metadata = { title: "Cinema partners" };

export default async function CinemasPage() {
  const user = await currentUser();
  const chains = CHAINS.map((c) => ({ id: c.id, name: c.name, currency: COUNTRY_BY_CODE[c.country].currency, flag: COUNTRY_BY_CODE[c.country].flag }));
  const links = user ? cinemaLinks(user.id) : [];
  const history = user ? purchases(user.id) : [];
  const films = listFilms({ sort: "title" }).map((f) => ({ id: f.id, title: f.title, flag: country(f.country)?.flag ?? "" }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-4xl font-bold">Cinemas 🎟️</h1>
        <p className="mt-1 max-w-2xl text-muted">
          Go to the movies, earn Kisah Points. Link your membership so tickets credit automatically, or type in the code from your e-ticket.
          Watch a <b className="text-saffron">local film in its home country</b> for ×{LOCAL_FILM_BONUS} points. Sokong filem tempatan!
        </p>
      </div>

      <section>
        <h2 className="section-title">Partner cinemas (demo)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CHAINS.map((c) => {
            const co = COUNTRY_BY_CODE[c.country];
            return (
              <div key={c.id} className="card overflow-hidden">
                <div className="h-1.5" style={{ background: c.color }} />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">{c.name}</div>
                    <span className="text-xl">{co.flag}</span>
                  </div>
                  <div className="text-xs text-muted">{c.tagline}</div>
                  <div className="mt-2 text-xs">
                    ≈ {Math.round(co.pointsPerUnit * c.multiplier * 100) / 100} KP per {co.currency}
                    {c.multiplier > 1 && <span className="ml-1 rounded bg-saffron/20 px-1 text-saffron">×{c.multiplier} promo</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">These partners are fictional, for demonstration only. Real chains plug in via the webhook API below. Max {MAX_POINTS_PER_TICKET} KP per ticket.</p>
      </section>

      {!user ? (
        <SignInPrompt what="link cinemas and claim tickets" next="/cinemas" />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card space-y-4 p-5">
              <h2 className="font-display text-xl font-bold">🎫 Claim a ticket</h2>
              <p className="text-sm text-muted">Enter the code from your e-ticket or receipt. If you add the film, it goes into your diary too.</p>
              <RedeemForm />
            </section>
            <section className="card space-y-4 p-5">
              <h2 className="font-display text-xl font-bold">🔗 Linked memberships</h2>
              {links.length > 0 && (
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l.chain_id} className="flex items-center gap-3 rounded-md bg-raised px-3 py-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHAIN_BY_ID[l.chain_id]?.color }} />
                      <span className="flex-1">{CHAIN_BY_ID[l.chain_id]?.name}</span>
                      <code className="text-xs text-muted">{l.member_ref}</code>
                      <form action={unlinkCinema.bind(null, l.chain_id)}>
                        <button className="text-xs text-muted hover:text-chili">unlink</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <LinkCinemaForm chains={chains} />
            </section>
          </div>

          <section className="card space-y-4 border-dashed p-5">
            <div>
              <h2 className="font-display text-xl font-bold">🧪 Demo box office</h2>
              <p className="text-sm text-muted">Pretend to buy a ticket at a partner cinema. You&apos;ll get a real, checksummed e-ticket code to claim above.</p>
            </div>
            <DemoBoxOffice chains={chains} films={films} />
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="section-title">Your cinema trips</h2>
              <div className="card divide-y divide-line">
                {history.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHAIN_BY_ID[p.chain_id]?.color }} />
                    <span className="w-40 font-semibold">{CHAIN_BY_ID[p.chain_id]?.name}</span>
                    <span className="flex-1 text-muted">{p.title ?? "General admission"}</span>
                    <span className="text-muted">{p.currency} {p.amount.toFixed(2)}</span>
                    <span className="w-24 text-right font-bold text-jade">+{p.points} KP{p.local_bonus ? " ×2" : ""}</span>
                    <span className="w-16 text-right text-xs text-muted">{timeAgo(p.created_at)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="card p-5">
        <h2 className="font-display text-xl font-bold">For cinema partners: webhook API</h2>
        <p className="mt-1 text-sm text-muted">
          POST purchases for linked members. Requests are signed with HMAC-SHA256 over <code>&lt;timestamp&gt;.&lt;body&gt;</code>, rejected if older than 5 minutes, and
          idempotent per <code>ticketRef</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink p-4 text-xs leading-relaxed text-muted">{`POST /api/cinema/webhook
X-Kisah-Timestamp: 1767225600
X-Kisah-Signature: sha256=<hex hmac>
Content-Type: application/json

{ "chain": "LPD", "memberRef": "LP123456", "ticketRef": "T-0001",
  "amount": 18.50, "currency": "MYR", "filmSlug": "ola-bola-2016" }`}</pre>
      </section>
    </div>
  );
}
