import Link from "next/link";
import { requireStaff } from "@/lib/auth";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  return (
    <div className="space-y-6">
      <nav className="glass flex flex-wrap items-center gap-1 p-1.5 text-sm font-semibold">
        <span className="px-3 font-display">🛠️ Admin</span>
        {[["/admin", "Overview"], ["/admin/items", "Items"], ["/admin/items/new", "＋ New item"], ["/admin/inquiries", "Inquiries"], ["/admin/campaigns", "Campaigns"], ["/admin/catalog", "Catalogue"], ["/admin/events", "Events"], ["/admin/outbox", "Outbox"], ["/admin/briefs", "Briefs"], ["/admin/artists", "Artists & payouts"], ["/specs", "Specs"]].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-muted hover:bg-raised hover:text-text">{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
