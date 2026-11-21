import { itemComments, itemVersions } from "@/lib/portal";
import { mediaUrl } from "@/lib/custom-item-map";
import { timeAgo } from "./ui";
import { ThreadForm } from "./ThreadForm";

const KIND: Record<string, [string, string]> = {
  submitted: ["📤", "border-saffron/50"], changes: ["✏️", "border-chili/60"], approved: ["✅", "border-jade/60"],
  live: ["🚀", "border-jade/60"], retired: ["🔐", "border-line"], comment: ["💬", "border-line"],
};

/** Review conversation + version history for an item. Shared by staff and contributors. */
export function ItemThread({ itemId }: { itemId: string }) {
  const comments = itemComments(itemId);
  const versions = itemVersions(itemId).filter((v) => v.asset_key);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="glass space-y-3 p-5">
        <h2 className="font-display text-lg font-bold">Review conversation</h2>
        {comments.length === 0 && <p className="text-sm text-muted">No messages yet. Questions about the brief or the artwork go here.</p>}
        <ol className="space-y-2">
          {comments.map((c) => {
            const [icon, border] = KIND[c.kind] ?? KIND.comment;
            return (
              <li key={c.id} className={`rounded-xl border-l-4 bg-black/20 p-3 text-sm ${border}`}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span>{icon}</span>
                  <b>{c.display_name}</b>
                  {(c.role === "admin" || c.role === "staff") && <span className="rounded bg-saffron/20 px-1 text-[0.6rem] font-bold uppercase text-saffron">KisahKisah</span>}
                  <span className="ml-auto text-xs text-muted">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-line">{c.body}</p>
              </li>
            );
          })}
        </ol>
        <ThreadForm itemId={itemId} />
      </section>
      {versions.length > 0 && (
        <section className="glass p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Versions</h2>
          <div className="grid grid-cols-3 gap-2">
            {versions.slice(0, 9).map((v, i) => (
              <figure key={v.id} className="rounded-lg bg-black/20 p-2 text-center text-[0.65rem] text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(v.asset_key!)} alt={`Version ${versions.length - i}`} className="mx-auto h-16 object-contain" />
                <figcaption>v{versions.length - i} · {timeAgo(v.created_at)}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
