import type { Metadata } from "next";
import Link from "next/link";
import { SPECS, THEME_TOKENS, THEME_TOKEN_LABELS, type UploadType } from "@/lib/asset-spec";

export const metadata: Metadata = { title: "Artwork specs" };

const ORDER: UploadType[] = ["sticker", "frame", "avatar", "banner", "effect"];

function Template({ type }: { type: UploadType }) {
  // A simple visual of the canvas and safe zones.
  if (type === "frame") {
    return (
      <svg viewBox="0 0 160 160" className="h-36 w-36" role="img" aria-label="Decoration canvas with a transparent avatar hole in the middle">
        <rect width="160" height="160" rx="8" fill="#1f232c" />
        <circle cx="80" cy="80" r="64" fill="#0e1014" stroke="#f5a524" strokeDasharray="4 3" />
        <text x="80" y="84" textAnchor="middle" fontSize="10" fill="#9aa1ad">avatar hole</text>
        <text x="80" y="14" textAnchor="middle" fontSize="9" fill="#ece8e1">decoration ring</text>
      </svg>
    );
  }
  if (type === "banner") {
    return (
      <svg viewBox="0 0 240 80" className="h-20 w-60" role="img" aria-label="Banner canvas; avoid the bottom-left corner">
        <rect width="240" height="80" rx="6" fill="#1f232c" />
        <rect x="0" y="40" width="60" height="40" fill="#ef444433" stroke="#ef4444" strokeDasharray="3 2" />
        <text x="30" y="64" textAnchor="middle" fontSize="8" fill="#fca5a5">avatar</text>
        <text x="150" y="44" textAnchor="middle" fontSize="9" fill="#ece8e1">3 : 1</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28" role="img" aria-label="Square canvas">
      <rect width="120" height="120" rx="8" fill="#1f232c" />
      {type === "avatar" && <circle cx="60" cy="60" r="56" fill="none" stroke="#f5a524" strokeDasharray="4 3" />}
      <text x="60" y="64" textAnchor="middle" fontSize="10" fill="#ece8e1">{type === "effect" ? "~5 : 6" : "1 : 1"}</text>
    </svg>
  );
}

export default function SpecsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold">Artwork specs</h1>
        <p className="max-w-2xl text-muted">
          For partners and artists making KisahKisah cosmetics. Every upload is checked automatically against these rules, and you can preview it on a real profile before
          it goes live. Files are converted to WebP and their metadata is removed.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ORDER.map((t) => {
          const s = SPECS[t];
          return (
            <section key={t} className="glass flex gap-4 p-5">
              <div className="shrink-0"><Template type={t} /></div>
              <div className="min-w-0 space-y-1 text-sm">
                <h2 className="font-display text-xl font-bold">{s.label}</h2>
                <div><b>Size:</b> {s.recommended}</div>
                <div><b>Formats:</b> {s.formats.join(", ").toUpperCase()} · <b>max</b> {Math.round(s.maxBytes / 1000)} KB</div>
                <div><b>Background:</b> {s.alpha === "required" ? "transparent" : "any"} · <b>Animation:</b> {s.animated === "recommended" ? "recommended" : s.animated === "allowed" ? "allowed" : "no"}</div>
                <ul className="list-disc pl-5 text-muted">{s.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </div>
            </section>
          );
        })}
        <section className="glass space-y-2 p-5 text-sm">
          <h2 className="font-display text-xl font-bold">App theme</h2>
          <p className="text-muted">Nine colours. Contrast is checked: text 4.5:1 on backgrounds, secondary text 3:1, and dark button text 4.5:1 on the accent.</p>
          <ul className="grid grid-cols-2 gap-1 text-muted">{THEME_TOKENS.map((k) => <li key={k}>• {THEME_TOKEN_LABELS[k]}</li>)}</ul>
        </section>
        <section className="glass space-y-2 p-5 text-sm">
          <h2 className="font-display text-xl font-bold">Name style</h2>
          <p className="text-muted">2–4 gradient colours, optional shimmer. Each colour needs 3:1 contrast against the dark page so names stay readable.</p>
        </section>
      </div>
      <p className="text-sm text-muted">Questions or partnership work? <Link href="/advertise" className="text-saffron">Get in touch →</Link></p>
    </div>
  );
}
