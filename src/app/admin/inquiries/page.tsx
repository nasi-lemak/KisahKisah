import { all } from "@/lib/db";
import { PACKAGES } from "@/lib/packages";
import { country } from "@/lib/regions";

type Inquiry = { id: number; company: string; contact_name: string; email: string; title: string; release_date: string | null; markets: string; package: string; message: string; created_at: string };

export default function Inquiries() {
  const rows = all<Inquiry>("SELECT * FROM ad_inquiries ORDER BY id DESC LIMIT 200");
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">Partner inquiries</h1>
      {rows.length === 0 ? (
        <div className="glass p-8 text-center text-muted">No inquiries yet. They arrive from the Advertise page.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="glass p-4 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg font-bold">{r.title}</span>
                <span className="text-muted">{r.company}</span>
                <span className="chip py-0">{PACKAGES.find((p) => p.id === r.package)?.name ?? r.package}</span>
                <span className="ml-auto text-xs text-muted">{r.created_at.slice(0, 16)}</span>
              </div>
              <div className="mt-1 text-muted">
                {r.contact_name} · <span className="select-all font-mono text-text">{r.email}</span>
                {r.release_date && <> · releases {r.release_date}</>} · {r.markets.split(",").map((m) => (m === "GLOBAL" ? "🌏" : country(m)?.flag ?? m)).join(" ")}
              </div>
              {r.message && <p className="mt-2 whitespace-pre-line">{r.message}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
