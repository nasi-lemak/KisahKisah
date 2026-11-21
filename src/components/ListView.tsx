import Link from "next/link";
import QRCode from "qrcode";
import { all } from "@/lib/db";
import { hasSavedList, listAccess, listCollaborators, listItems, listFilms, type ListSummary } from "@/lib/queries";
import { country } from "@/lib/regions";
import { EST_HOURS } from "@/lib/rewind";
import { posterColors } from "@/lib/poster";
import { siteUrl } from "@/lib/site";
import { franchisesFor } from "@/lib/franchises";
import { Avatar, Poster, StyledName } from "./ui";
import { ShareSheet } from "./ShareSheet";
import { AddTitles, ListSettings } from "./ListTools";
import { watchedSlugs } from "./FranchisePanel";
import { deleteList, duplicateList, moveListItem, removeCollaborator, removeFromList, toggleSaveList } from "@/app/actions";

const VIS = { public: ["🌏", "Public catalogue"], unlisted: ["🔗", "Unlisted catalogue"], private: ["🔒", "Private catalogue"] } as const;

/** 2×2 cover collage, like a playlist cover. */
export function ListCover({ slugs, motifs, size = 224 }: { slugs: string[]; motifs: string[]; size?: number }) {
  const tiles = slugs.slice(0, 4);
  if (tiles.length < 4) {
    const s = tiles[0] ?? "empty";
    const [a, b] = posterColors(s);
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl text-6xl shadow-2xl" style={{ width: size, height: size, background: `linear-gradient(160deg, ${a}, ${b})` }}>
        {motifs[0] ?? "🎞️"}
      </div>
    );
  }
  return (
    <div className="grid shrink-0 grid-cols-2 overflow-hidden rounded-xl shadow-2xl" style={{ width: size, height: size }}>
      {tiles.map((s, i) => {
        const [a, b] = posterColors(s);
        return (
          <div key={s} className="flex items-center justify-center text-4xl" style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}>
            {motifs[i]}
          </div>
        );
      })}
    </div>
  );
}

export async function ListView({ list, viewer, viaToken }: { list: ListSummary; viewer: { id: number } | null; viaToken: boolean }) {
  const access = listAccess(list, viewer?.id, viaToken);
  const items = listItems(list.id);
  const collabs = listCollaborators(list.id);
  const seen = watchedSlugs(viewer?.id, items.map((i) => i.slug));
  const watched = items.filter((i) => seen.has(i.slug)).length;
  const next = items.find((i) => !seen.has(i.slug)) ?? items[0];
  const hours = items.reduce((h, i) => h + (i.kind === "series" ? EST_HOURS.series : EST_HOURS.film), 0);
  const saved = viewer ? hasSavedList(list.id, viewer.id) : false;
  const shareUrl = `${await siteUrl()}/l/${list.share_token}`;
  const qr = await QRCode.toString(shareUrl, { type: "svg", margin: 0, color: { dark: "#0e1014", light: "#ffffff" } });
  const [c1] = posterColors(items[0]?.slug ?? list.title);
  const [vIcon, vLabel] = VIS[list.visibility] ?? VIS.public;
  const allFilms = access.edit
    ? listFilms({ sort: "title" }).map((f) => ({ id: f.id, title: f.title, year: f.year, flag: country(f.country)?.flag ?? "", kind: f.kind }))
    : [];
  const kinds = all<{ n: number }>("SELECT COUNT(*) n FROM list_items i JOIN films f ON f.id = i.film_id WHERE i.list_id = ? AND f.kind = 'series'", list.id)[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <header className="-mx-4 -mt-8 px-4 pb-6 pt-10 sm:rounded-b-3xl" style={{ background: `linear-gradient(180deg, ${c1} 0%, color-mix(in srgb, ${c1} 35%, var(--color-ink)) 55%, var(--color-ink) 100%)` }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-end">
          <ListCover slugs={items.map((i) => i.slug)} motifs={items.map((i) => i.motif)} />
          <div className="min-w-0 space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              {vIcon} {vLabel}
              {list.collaborative ? " · 🤝 Collaborative" : ""}
              {list.ranked ? " · Ranked" : ""}
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">{list.title}</h1>
            {list.description && <p className="max-w-2xl text-white/80">{list.description}</p>}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90">
              <Link href={`/u/${list.username}`} className="flex items-center gap-2 font-bold hover:underline">
                <Avatar item={list.avatar_item} frame={list.frame_item} size={26} />
                <StyledName name={list.display_name} style={list.namestyle_item} />
              </Link>
              {collabs.map((c) => (
                <Link key={c.id} href={`/u/${c.username}`} title={`Collaborator: ${c.display_name}`} className="-ml-1">
                  <Avatar item={c.avatar_item} size={22} />
                </Link>
              ))}
              <span className="text-white/70">
                · {items.length} title{items.length === 1 ? "" : "s"}{kinds ? ` (${kinds} series)` : ""} · ≈{hours}h · {list.save_count} save{list.save_count === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {next && (
          <Link href={`/film/${next.slug}`} className="flex h-14 w-14 items-center justify-center rounded-full bg-jade text-2xl text-ink shadow-lg transition hover:scale-105" title={`Watch next: ${next.title}`} aria-label={`Watch next: ${next.title}`}>
            ▶
          </Link>
        )}
        {viewer && !access.own && (
          <form action={toggleSaveList.bind(null, list.id)}>
            <button className={`btn ${saved ? "btn-primary" : "btn-ghost"}`}>{saved ? "✓ Saved" : "＋ Save"}</button>
          </form>
        )}
        {list.visibility !== "private" ? (
          <ShareSheet url={shareUrl} title={list.title} text={`“${list.title}”, a catalogue by ${list.display_name} on KisahKisah`} qrSvg={qr} />
        ) : (
          access.own && <span className="text-sm text-muted">🔒 Private: make it public or unlisted to share</span>
        )}
        {viewer && (
          <form action={duplicateList.bind(null, list.id)}>
            <button className="btn btn-ghost" title="Make your own copy">⧉ Duplicate</button>
          </form>
        )}
        {viewer && items.length > 0 && (
          <div className="ml-auto min-w-48 flex-1 sm:max-w-xs">
            <div className="flex justify-between text-xs text-muted">
              <span>{watched === items.length ? "✓ You've watched them all" : `You've watched ${watched} of ${items.length}`}</span>
              <span>{Math.round((watched / items.length) * 100)}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-jade" style={{ width: `${(watched / items.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Track list */}
      {items.length === 0 ? (
        <div className="glass p-8 text-center text-muted">Nothing here yet.{access.edit ? " Add the first title below." : ""}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
                <th className="w-10 py-2 pl-3">#</th>
                <th className="py-2">Title</th>
                <th className="py-2">Year</th>
                <th className="hidden py-2 md:table-cell">Director / creator</th>
                <th className="py-2">★</th>
                {list.collaborative ? <th className="hidden py-2 lg:table-cell">Added by</th> : null}
                <th className="w-24 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => {
                const fr = franchisesFor(f.slug)[0];
                return (
                  <tr key={f.id} className="group border-b border-line/50 hover:bg-raised/50">
                    <td className="py-2 pl-3 text-muted">{seen.has(f.slug) ? <span className="text-jade" title="Watched">✓</span> : i + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 shrink-0"><Poster film={f} size="sm" /></div>
                        <div className="min-w-0">
                          <Link href={`/film/${f.slug}`} className="font-semibold hover:text-saffron">{f.title}</Link>
                          <div className="flex flex-wrap gap-x-2 text-xs text-muted">
                            <span>{country(f.country)?.flag} {country(f.country)?.name}</span>
                            {f.kind === "series" && <span className="text-lotus">Series{f.seasons ? ` · ${f.seasons} seasons` : ""}</span>}
                            {fr && <span className="text-saffron">{fr.kind === "Trilogy" || fr.kind === "Loose trilogy" ? "🎞️" : "📚"} {fr.name}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-muted">{f.year}</td>
                    <td className="hidden py-2 text-muted md:table-cell">{f.director}</td>
                    <td className="py-2 font-mono">{f.avg_rating ? f.avg_rating.toFixed(1) : "–"}</td>
                    {list.collaborative ? <td className="hidden py-2 text-muted lg:table-cell">{f.added_by_name ?? "–"}</td> : null}
                    <td className="py-2 pr-2 text-right">
                      {access.edit && (
                        <span className="inline-flex gap-1 opacity-60 group-hover:opacity-100">
                          <form action={moveListItem.bind(null, list.id, f.id, -1)}><button className="px-1.5 text-muted hover:text-text" aria-label="Move up">↑</button></form>
                          <form action={moveListItem.bind(null, list.id, f.id, 1)}><button className="px-1.5 text-muted hover:text-text" aria-label="Move down">↓</button></form>
                          <form action={removeFromList.bind(null, list.id, f.id)}><button className="px-1.5 text-muted hover:text-chili" aria-label="Remove">✕</button></form>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {access.edit && <AddTitles listId={list.id} films={allFilms} inList={items.map((i) => i.id)} />}

      {access.own && (
        <div className="space-y-3">
          <ListSettings list={list} />
          {collabs.length > 0 && (
            <div className="glass flex flex-wrap items-center gap-2 p-4 text-sm">
              <span className="font-bold">Collaborators:</span>
              {collabs.map((c) => (
                <form key={c.id} action={removeCollaborator.bind(null, list.id, c.id)} className="chip">
                  <Avatar item={c.avatar_item} size={18} /> {c.display_name}
                  <button className="text-muted hover:text-chili" aria-label={`Remove ${c.display_name}`}>✕</button>
                </form>
              ))}
            </div>
          )}
          <form action={deleteList.bind(null, list.id)}>
            <button className="text-sm text-muted hover:text-chili">Delete this catalogue</button>
          </form>
        </div>
      )}
      {!access.own && access.edit && (
        <form action={removeCollaborator.bind(null, list.id, viewer!.id)}>
          <button className="text-sm text-muted hover:text-chili">Leave this collaborative catalogue</button>
        </form>
      )}
    </div>
  );
}
