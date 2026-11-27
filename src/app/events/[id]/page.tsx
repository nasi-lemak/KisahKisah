import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { activeOccurrence, eventById, isApproximate, isTargeted, nextOccurrence, parsePreviewDate, today, visibleTo } from "@/lib/events";
import { audience } from "@/lib/geo";
import { TrackOnView } from "@/components/Track";
import { eventClaimCount, filmsBySlugs, inventory } from "@/lib/queries";
import { ITEM_BY_ID } from "@/lib/shop";
import { country } from "@/lib/regions";
import { ItemPreview, RarityTag } from "@/components/ItemPreview";
import { ClaimButton } from "@/components/EventBits";
import { Poster } from "@/components/ui";
import { NotifyButton } from "@/components/NotifyButton";
import { reminderState } from "@/lib/reminders";
import { canSignUp } from "@/lib/reminders-core";
import { campaignById } from "@/lib/portal";
import { publicQuiz, quizPlay } from "@/lib/quiz";
import { CampaignQuiz } from "@/components/CampaignQuiz";
import { getI18n } from "@/lib/i18n/server";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = eventById((await params).id);
  return { title: e?.name ?? "Event" };
}


export default async function EventPage({ params, searchParams }: { params: Params; searchParams: Promise<{ preview?: string }> }) {
  const e = eventById((await params).id);
  if (!e) notFound();
  const preview = parsePreviewDate((await searchParams).preview);
  const user = await currentUser();
  const now = today();
  const liveNow = activeOccurrence(e, now);
  const shown = liveNow ?? activeOccurrence(e, preview ?? now) ?? nextOccurrence(e, preview ?? now);
  const owned = new Set(user ? inventory(user.id) : []);
  const featured = filmsBySlugs(e.featured);
  const claimed = shown ? eventClaimCount(e.id, shown.start) : 0;
  const who = await audience();
  const canSee = who === "all" || visibleTo(e, who);
  const cmpId = /^cmp-(\d+)$/.exec(e.id)?.[1];
  const cmp = cmpId ? campaignById(Number(cmpId)) : undefined;
  const remindTarget = cmp && canSignUp(cmp.release_date, now) ? `cmp:${cmp.id}` : null;
  const bonusItem = cmp?.ticket_item ? ITEM_BY_ID[cmp.ticket_item] : undefined;
  const ticketBonus = cmp && cmp.film_slug && (cmp.ticket_bonus_pct > 0 || bonusItem) ? cmp : null;
  const { t, date: fmt } = await getI18n();
  const markets = isTargeted(e) ? e.markets!.map((m) => country(m)?.flag ?? m).join(" ") : null;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-line" style={{ background: `linear-gradient(135deg, ${e.colors[0]}, ${e.colors[1]})` }}>
        <div className="bg-black/45 p-8 sm:p-10">
          {e.sponsor && (
            <div className="mb-3 inline-block rounded bg-white/15 px-2 py-0.5 text-xs uppercase tracking-widest">{e.sponsor.disclosure}</div>
          )}
          <div className="text-5xl">{e.icon}</div>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{e.name}</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/85">{e.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            {liveNow ? (
              <span className="rounded-full bg-jade px-3 py-1 font-bold text-ink">{t("event.liveUntil", { date: fmt(liveNow.end) })}</span>
            ) : shown ? (
              <span className="rounded-full bg-white/15 px-3 py-1">{t("event.next", { date: fmt(shown.start) })}{isApproximate(e, Number(shown.start.slice(0, 4))) ? ` ${t("event.dateApprox")}` : ""}</span>
            ) : null}
            {claimed > 0 && <span className="text-white/80">{claimed === 1 ? t("event.joinedOne") : t("event.joinedMany", { n: claimed })}</span>}
            {markets ? (
              <span className="text-white/80">{t("event.runningIn", { flags: markets })}</span>
            ) : (
              e.spotlight && <span className="text-white/80">{t("event.spotlight", { flags: e.spotlight.map((c) => country(c)?.flag).join(" ") })}</span>
            )}
          </div>
        </div>
      </section>

      <TrackOnView eventId={e.id} metric="view" />
      {!canSee && liveNow && (
        <p className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-sm">
          {t("event.notHere", { countries: e.markets!.map((m) => country(m)?.name ?? m).join(", ") })}
        </p>
      )}
      <p className="max-w-3xl text-muted">{e.blurb}</p>

      {e.promo && (
        <section className="card grid gap-5 p-5 sm:grid-cols-[140px_1fr]">
          <Poster film={{ slug: e.id, title: e.promo.title, year: Number(e.promo.releaseDate.slice(0, 4)), country: e.promo.country, motif: e.promo.motif }} link={false} />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted">{t("event.comingTo", { date: fmt(e.promo.releaseDate) })}</div>
            <h2 className="font-display text-2xl font-bold">{e.promo.title}</h2>
            <p className="italic text-saffron">{e.promo.tagline}</p>
            <p className="mt-2 text-sm">{e.promo.synopsis}</p>
            {remindTarget && canSee && (
              <div className="mt-4">
                <NotifyButton target={remindTarget} date={cmp!.release_date!} initial={reminderState(user?.id ?? null, remindTarget)} signedIn={!!user} verified={!!user?.email_verified_at} />
              </div>
            )}
            {e.sponsor && <p className="mt-3 text-xs text-muted">{t("event.presentedBy", { sponsor: e.sponsor.name })}</p>}
          </div>
        </section>
      )}

      {e.offers.length > 0 && (
        <section>
          <h2 className="section-title">{liveNow ? t("event.dropsLive") : t("event.dropsVaulted")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {e.offers.map((o) => {
              const item = ITEM_BY_ID[o.item];
              if (!item) return null;
              return (
                <div key={o.item} className="card flex flex-col items-center gap-2 p-4 text-center">
                  <div className="flex h-24 w-full items-center justify-center">
                    <ItemPreview item={item} avatar={user?.avatar_item} />
                  </div>
                  <RarityTag item={item} />
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs capitalize text-muted">{item.type}</div>
                  <div className="mt-auto w-full pt-1">
                    <ClaimButton
                      eventId={e.id} itemId={item.id} price={o.price} owned={owned.has(item.id)}
                      affordable={(user?.points ?? 0) >= o.price} live={!!liveNow && canSee} signedIn={!!user}
                      lockedLabel={liveNow && !canSee ? t("drop.notRegion") : t("drop.notLive")}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {cmp && liveNow && canSee && publicQuiz(cmp.id).length > 0 && (
        <section className="card space-y-3 p-5">
          <h2 className="font-display text-xl font-bold">{t("event.kuiz", { title: cmp.title })}</h2>
          {user ? (
            <CampaignQuiz campaignId={cmp.id} questions={publicQuiz(cmp.id)} reward={cmp.quiz_reward} played={quizPlay(user.id, cmp.id) ?? null} />
          ) : (
            <Link href={`/login?next=/events/${e.id}`} className="btn btn-ghost">{t("event.kuizSignIn")}</Link>
          )}
        </section>
      )}

      {ticketBonus && canSee && (
        <section className="card flex flex-wrap items-center gap-4 border-saffron/40 p-5">
          <div className="text-4xl">🎟️</div>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{liveNow ? t("event.cinema") : t("event.cinemaDuring")}</div>
            <div className="text-sm text-muted">
              {ticketBonus.ticket_bonus_pct > 0 && bonusItem
                ? t("event.ticketBoth", { title: e.promo?.title ?? e.name, pct: ticketBonus.ticket_bonus_pct, item: bonusItem.name })
                : ticketBonus.ticket_bonus_pct > 0
                  ? t("event.ticketKp", { title: e.promo?.title ?? e.name, pct: ticketBonus.ticket_bonus_pct })
                  : t("event.ticketItem", { title: e.promo?.title ?? e.name, item: bonusItem!.name })}
            </div>
          </div>
          {bonusItem && (
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-16 w-16 items-center justify-center"><ItemPreview item={bonusItem} avatar={user?.avatar_item} /></div>
              <span className="text-[0.65rem] uppercase tracking-widest text-muted">{owned.has(bonusItem.id) ? t("event.yours") : t("event.ticketOnly")}</span>
            </div>
          )}
          <Link href="/cinemas" className="btn btn-primary">{t("event.redeem")}</Link>
        </section>
      )}

      {e.bonus && (
        <section className="card flex flex-wrap items-center gap-4 p-5">
          <div className="text-4xl">🪙</div>
          <div>
            <div className="font-bold">{t("event.bonus", { label: e.bonus.label })}</div>
            <div className="text-sm text-muted">{t("event.bonusBody", { kp: e.bonus.points, max: e.bonus.maxLogs })}</div>
          </div>
          <Link href="/films" className="btn btn-ghost ml-auto">{t("event.findWatch")}</Link>
        </section>
      )}

      {e.link && (
        <Link href={e.link.href} className="btn btn-primary">{e.link.label} →</Link>
      )}

      {featured.length > 0 && (
        <section>
          <h2 className="section-title">{t("event.featured", { name: e.name })}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {featured.map((f) => (
              <Poster key={f.id} film={f} />
            ))}
          </div>
        </section>
      )}

      <Link href="/events" className="text-sm text-muted hover:text-text">{t("event.all")}</Link>
    </div>
  );
}
