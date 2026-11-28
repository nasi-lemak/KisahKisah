import Link from "next/link";
import type { ListSummary } from "@/lib/queries";
import { posterColors } from "./ui";
import { getT } from "@/lib/i18n/server";

const VIS = { public: "lists.vis.public", unlisted: "lists.vis.unlisted", private: "lists.vis.private" } as const;

/** Server component (reads the viewer's language). */
export async function ListCard({ l, showVisibility = false }: { l: ListSummary; showVisibility?: boolean }) {
  const slugs = (l.preview ?? "").split(",").filter(Boolean);
  const t = await getT();
  const vis = VIS[l.visibility as keyof typeof VIS];
  const href = l.visibility === "public" ? `/lists/${l.id}` : `/l/${l.share_token}`;
  return (
    <Link href={href} className="card group flex items-center gap-4 p-4 transition hover:border-saffron/60">
      <div className="grid h-24 w-24 shrink-0 grid-cols-2 overflow-hidden rounded-lg shadow-lg">
        {(slugs.length >= 4 ? slugs.slice(0, 4) : [slugs[0] ?? l.title]).map((s) => {
          const [a, b] = posterColors(s);
          return <div key={s} className={slugs.length >= 4 ? "" : "col-span-2 row-span-2"} style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} />;
        })}
      </div>
      <div className="min-w-0">
        <div className="font-display text-lg font-bold group-hover:text-saffron">{l.title}</div>
        <div className="text-xs text-muted">
          {t("lists.card.by", { name: l.display_name })} · {t("lists.card.titles", { n: l.item_count })}{l.ranked ? ` · ${t("lists.card.ranked")}` : ""}
          {l.collaborative ? ` · ${t("lists.card.collab")}` : ""}
          {l.save_count ? ` · 📌 ${l.save_count}` : ""}
          {showVisibility ? ` · ${vis ? t(vis) : ""}` : ""}
        </div>
        {l.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{l.description}</p>}
      </div>
    </Link>
  );
}
