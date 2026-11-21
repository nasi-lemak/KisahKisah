import Link from "next/link";
import type { Metadata } from "next";
import { ADD_ONS, GUARDRAILS, PACKAGES } from "@/lib/packages";
import { COUNTRIES } from "@/lib/regions";
import { AdInquiryForm } from "@/components/AdInquiryForm";

export const metadata: Metadata = { title: "Advertise your film" };

export default function AdvertisePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-line bg-gradient-to-br from-[#2a1607] via-surface to-[#1a0d2e] p-8 sm:p-12">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">For studios, distributors & streamers</div>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          Launch your title where fans <span className="text-saffron">collect</span> it, not just scroll past it.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Sponsored campaigns on KisahKisah are things fans actually want: limited themes, sticker packs, frames and launch-week events.
          Southeast Asia first, global reach.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <a href="#inquire" className="btn btn-primary">Talk to us</a>
          <Link href="/events/orbit-of-the-hornbill" className="btn btn-ghost">See a sample campaign →</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["🎁", "Collectible, not interruptive", "Fans opt in to claim your stickers and themes, then show them off on every review they write."],
          ["⏳", "Built-in urgency", "Every drop is limited-time. When the campaign ends it goes into the Vault, which is why people claim early."],
          ["🎟️", "Tied to real tickets", "Partner-cinema bonuses and release-day reminders turn interest into seats."],
        ].map(([icon, t, b]) => (
          <div key={t} className="card p-5">
            <div className="text-3xl">{icon}</div>
            <div className="mt-2 font-bold">{t}</div>
            <p className="mt-1 text-sm text-muted">{b}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="section-title">Packages</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p) => (
            <div key={p.id} className={`card flex flex-col p-5 ${p.highlight ? "border-saffron shadow-[0_0_0_1px_var(--color-saffron)]" : ""}`}>
              {p.highlight && <div className="mb-2 self-start rounded bg-saffron px-2 py-0.5 text-xs font-bold text-ink">Most popular</div>}
              <div className="text-3xl">{p.icon}</div>
              <div className="mt-1 font-display text-xl font-bold">{p.name}</div>
              <div className="text-xs text-muted">{p.duration}</div>
              <p className="mt-2 text-sm italic text-lotus">{p.bestFor}</p>
              <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                {p.includes.map((i) => (
                  <li key={i} className="flex gap-2"><span className="text-jade">✓</span>{i}</li>
                ))}
              </ul>
              <a href="#inquire" className="btn btn-ghost mt-4 justify-center">Get a quote</a>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="section-title">Add-ons</h2>
          <div className="space-y-2">
            {ADD_ONS.map((a) => (
              <div key={a.name} className="card p-4">
                <div className="font-semibold">{a.name}</div>
                <p className="text-sm text-muted">{a.detail}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="section-title">Our promise to the community</h2>
          <ul className="card space-y-2 p-5 text-sm">
            {GUARDRAILS.map((g) => (
              <li key={g} className="flex gap-2"><span>🛡️</span>{g}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="inquire" className="card scroll-mt-24 p-6">
        <h2 className="font-display text-2xl font-bold">Start a campaign</h2>
        <p className="mb-5 text-sm text-muted">Tell us about your title. We&apos;ll send a proposal with timing, markets and pricing.</p>
        <AdInquiryForm packages={PACKAGES} markets={COUNTRIES.map((c) => ({ code: c.code, name: c.name, flag: c.flag }))} />
      </section>
    </div>
  );
}
