import Link from "next/link";
import type { ListSummary } from "@/lib/queries";
import { posterColors } from "./ui";

export function ListCard({ l }: { l: ListSummary }) {
  const slugs = (l.preview ?? "").split(",").filter(Boolean);
  return (
    <Link href={`/lists/${l.id}`} className="card group flex items-center gap-4 p-4 transition hover:border-saffron/60">
      <div className="flex h-24 w-36 shrink-0">
        {slugs.slice(0, 5).map((s, i) => {
          const [a, b] = posterColors(s);
          return (
            <div
              key={s}
              className="h-24 w-16 shrink-0 rounded-md shadow-lg ring-1 ring-black/40"
              style={{ background: `linear-gradient(160deg, ${a}, ${b})`, marginLeft: i ? -40 : 0, zIndex: 10 - i }}
            />
          );
        })}
      </div>
      <div className="min-w-0">
        <div className="font-display text-lg font-bold group-hover:text-saffron">{l.title}</div>
        <div className="text-xs text-muted">
          by {l.display_name} · {l.item_count} films{l.ranked ? " · ranked" : ""}
        </div>
        {l.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{l.description}</p>}
      </div>
    </Link>
  );
}
