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
import { getT } from "@/lib/i18n/server";

const VIS = { public: ["🌏", "lists.view.public"], unlisted: ["🔗", "lists.view.unlisted"], private: ["🔒", "lists.view.private"] } as const;

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
  const t = await getT();
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
  const [vIcon, vLabel] = VIS[list.visibility as keyof typeof VIS] ?? VIS.public;
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
              {vIcon} {t(vLabel)}
              {list.collaborative ? ` · ${t("lists.view.collab")}` : ""}
              {list.ranked ? ` · ${t("lists.view.ranked")}` : ""}
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white sm:text-6xl">{list.title}</h1>
            {list.description && <p className="max-w-2xl text-white/80">{list.description}</p>}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/90">
              <Link href={`/u/${list.username}`} className="flex items-center gap-2 font-bold hover:underline">
                <Avatar item={list.avatar_item} frame={list.frame_item} size={26} />
                <StyledName name={list.display_name} style={list.namestyle_item} />
              </Link>
              {collabs.map((c) => (
                <Link key={c.id} href={`/u/${c.username}`} title={t("lists.view.collaborator", { name: c.display_name })} className="-ml-1">
                  <Avatar item={c.avatar_item} size={22} />
                </Link>
              ))}
              <span className="text-white/70">
                · {t(items.length === 1 ? "lists.view.titlesOne" : "lists.view.titlesMany", { n: items.length })}{kinds ? ` ${t("lists.view.series", { n: kinds })}` : ""} · {t("lists.view.hours", { n: hours })} · {t(list.save_count === 1 ? "lists.view.savesOne" : "lists.view.savesMany", { n: list.save_count })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        {next && (
          <Link href={`/film/${next.slug}`} className="flex h-14 w-14 items-center justify-center rounded-full bg-jade text-2xl text-ink shadow-lg transition hover:scale-105" title={t("lists.view.watchNext", { title: next.title })} aria-label={t("lists.view.watchNext", { title: next.title })}>
            ▶
          </Link>
        )}
        {viewer && !access.own && (
          <form action={toggleSaveList.bind(null, list.id)}>
            <button className={`btn ${saved ? "btn-primary" : "btn-ghost"}`}>{saved ? t("lists.view.savedBtn") : t("lists.view.save")}</button>
          </form>
        )}
        {list.visibility !== "private" ? (
          <ShareSheet url={shareUrl} title={list.title} text={t("lists.view.shareText", { title: list.title, name: list.display_name })} qrSvg={qr} />
        ) : (
          access.own && <span className="text-sm text-muted">{t("lists.view.privateNote")}</span>
        )}
        {viewer && (
          <form action={duplicateList.bind(null, list.id)}>
            <button className="btn btn-ghost" title={t("lists.view.copyHint")}>{t("lists.view.duplicate")}</button>
          </form>
        )}
        {viewer && items.length > 0 && (
          <div className="ml-auto min-w-48 flex-1 sm:max-w-xs">
            <div className="flex justify-between text-xs text-muted">
              <span>{watched === items.length ? t("lists.view.watchedAll") : t("lists.view.watchedSome", { n: watched, total: items.length })}</span>
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
        <div className="glass p-8 text-center text-muted">{t("lists.view.empty")}{access.edit ? ` ${t("lists.view.emptyEdit")}` : ""}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-muted">
                <th className="w-10 py-2 pl-3">#</th>
                <th className="py-2">{t("lists.view.colTitle")}</th>
                <th className="py-2">{t("lists.view.colYear")}</th>
                <th className="hidden py-2 md:table-cell">{t("lists.view.colDirector")}</th>
                <th className="py-2">★</th>
                {list.collaborative ? <th className="hidden py-2 lg:table-cell">{t("lists.view.colAddedBy")}</th> : null}
                <th className="w-24 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => {
                const fr = franchisesFor(f.slug)[0];
                return (
                  <tr key={f.id} className="group border-b border-line/50 hover:bg-raised/50">
                    <td className="py-2 pl-3 text-muted">{seen.has(f.slug) ? <span className="text-jade" title={t("lists.view.watched")}>✓</span> : i + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 shrink-0"><Poster film={f} size="sm" /></div>
                        <div className="min-w-0">
                          <Link href={`/film/${f.slug}`} className="font-semibold hover:text-saffron">{f.title}</Link>
                          <div className="flex flex-wrap gap-x-2 text-xs text-muted">
                            <span>{country(f.country)?.flag} {country(f.country)?.name}</span>
                            {f.kind === "series" && <span className="text-lotus">{t("lists.view.seriesTag")}{f.seasons ? ` · ${t("lists.view.seasons", { n: f.seasons })}` : ""}</span>}
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
                          <form action={moveListItem.bind(null, list.id, f.id, -1)}><button className="px-1.5 text-muted hover:text-text" aria-label={t("lists.moveUp")}>↑</button></form>
                          <form action={moveListItem.bind(null, list.id, f.id, 1)}><button className="px-1.5 text-muted hover:text-text" aria-label={t("lists.moveDown")}>↓</button></form>
                          <form action={removeFromList.bind(null, list.id, f.id)}><button className="px-1.5 text-muted hover:text-chili" aria-label={t("lists.remove")}>✕</button></form>
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
              <span className="font-bold">{t("lists.view.collaborators")}</span>
              {collabs.map((c) => (
                <form key={c.id} action={removeCollaborator.bind(null, list.id, c.id)} className="chip">
                  <Avatar item={c.avatar_item} size={18} /> {c.display_name}
                  <button className="text-muted hover:text-chili" aria-label={t("lists.view.removeName", { name: c.display_name })}>✕</button>
                </form>
              ))}
            </div>
          )}
          <form action={deleteList.bind(null, list.id)}>
            <button className="text-sm text-muted hover:text-chili">{t("lists.view.delete")}</button>
          </form>
        </div>
      )}
      {!access.own && access.edit && (
        <form action={removeCollaborator.bind(null, list.id, viewer!.id)}>
          <button className="text-sm text-muted hover:text-chili">{t("lists.view.leave")}</button>
        </form>
      )}
    </div>
  );
}
