import Link from "next/link";
import { all } from "@/lib/db";

export default function AdminHome() {
  const counts = Object.fromEntries(all<{ status: string; n: number }>("SELECT status, COUNT(*) n FROM custom_items GROUP BY status").map((r) => [r.status, r.n]));
  const inquiries = all<{ n: number }>("SELECT COUNT(*) n FROM ad_inquiries WHERE created_at >= datetime('now', '-30 days')")[0]?.n ?? 0;
  const tiles: [string, number, string, string][] = [
    ["Needs review", counts.submitted ?? 0, "/admin/items?status=submitted", "Submitted by partners and artists"],
    ["Drafts", counts.draft ?? 0, "/admin/items?status=draft", "Being made or waiting for changes"],
    ["Awaiting publish", counts.approved ?? 0, "/admin/items?status=approved", "Approved, ready to go live"],
    ["Live", counts.live ?? 0, "/admin/items?status=live", "In the Kedai or an event now"],
    ["Partner inquiries (30d)", inquiries, "/admin/inquiries", "From the Advertise page"],
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-extrabold">Overview</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(([label, n, href, hint]) => (
          <Link key={label} href={href} className="glass p-5 transition hover:ring-1 hover:ring-saffron/50">
            <div className="font-display text-4xl font-extrabold">{n}</div>
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-muted">{hint}</div>
          </Link>
        ))}
      </div>
      <section className="glass p-5 text-sm">
        <h2 className="mb-2 font-display text-lg font-bold">How an item goes live</h2>
        <ol className="grid gap-2 sm:grid-cols-4">
          {[
            ["Upload", "Drop the artwork. Size, format, transparency and the avatar-hole are checked instantly."],
            ["Preview", "See it on a real profile card, in the shop and on a review before anyone buys it."],
            ["Approve", "A second person checks it. Only items passing every check can be approved."],
            ["Publish", "One click puts it in the Kedai or an event. Retire sends it to the vault; owners keep it."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-xl bg-black/20 p-3">
              <div className="text-xs font-bold text-saffron">Step {i + 1}</div>
              <div className="font-bold">{t}</div>
              <p className="text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
