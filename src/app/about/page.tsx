import Link from "next/link";
import type { Metadata } from "next";
import { POINTS } from "@/lib/rewards";
import { GAME_INFO } from "@/lib/games";
import { LOCAL_FILM_BONUS } from "@/lib/cinema";

export const metadata: Metadata = { title: "How points work" };

export default function AboutPage() {
  const earn: [string, string][] = [
    ["Sign up", `${POINTS.welcome} KP`],
    ["Log a film (first time per film)", `${POINTS.log} KP`],
    ["Review a film (40+ characters)", `${POINTS.review} KP`],
    ["Long-form review bonus (400+ characters)", `+${POINTS.longReview} KP`],
    ["Someone likes your review", `${POINTS.likeReceived} KP`],
    [`Comment on someone's review (up to ${POINTS.commentsPerDay}/day)`, `${POINTS.comment} KP`],
    ["Create a catalogue", `${POINTS.list} KP`],
    ["Daily check-in", `${POINTS.dailyCheckin} KP`],
    ...Object.values(GAME_INFO).map((g) => [`Win ${g.name} on a review`, `up to ${g.reward}+ KP`] as [string, string]),
    ["Cinema tickets", `≈1 KP per USD 0.22 · ×${LOCAL_FILM_BONUS} for local films`],
    ["Achievements", "20–500 KP each"],
  ];
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold">How Kisah Points work</h1>
        <p className="mt-2 text-muted">
          Kisah Points (KP) are earned by being part of the community and spent in the <Link href="/kedai" className="text-saffron">Kedai</Link> on
          avatars, frames, banners and titles. They&apos;re just for fun: no cash value, no pay-to-win.
        </p>
      </div>
      <div className="card divide-y divide-line">
        {earn.map(([what, kp]) => (
          <div key={what} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
            <span>{what}</span>
            <span className="shrink-0 font-semibold text-saffron">{kp}</span>
          </div>
        ))}
      </div>
      <div className="card space-y-2 p-5 text-sm text-muted">
        <h2 className="font-display text-lg font-bold text-text">Fair play</h2>
        <p>Each reward is granted once per thing: re-logging a film or re-liking a review won&apos;t farm points. Mini games allow one attempt per review, and you can&apos;t play your own.</p>
        <p>Cinema tickets are verified with the cinema, and each ticket can only be claimed once.</p>
      </div>
      <div className="card space-y-2 p-5 text-sm text-muted">
        <h2 className="font-display text-lg font-bold text-text">Reviews live everywhere</h2>
        <p>
          A Korean film is best discussed on Watcha and Naver, a Chinese film on Douban, a Japanese film on Filmarks. KisahKisah links every film to the
          platforms its home audience uses, searched by its original-script title, and lets you cross-post links to your reviews there.
        </p>
      </div>
    </div>
  );
}
