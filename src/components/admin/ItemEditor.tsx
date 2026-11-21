"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveCustomItem, setItemStatus, type SaveInput } from "@/app/admin/actions";
import { contributorSaveItem, submitItem, withdrawItem } from "@/app/contribute/actions";
import { mediaUrl, readiness, toShopItem, type CustomData } from "@/lib/custom-item-map";
import { SPECS, THEME_TOKENS, THEME_TOKEN_LABELS, validateGradient, validateTheme, type CheckResult, type UploadType } from "@/lib/asset-spec";
import { RARITY_STYLE, registerItems, type ItemType, type Rarity, type ShopItem } from "@/lib/shop";
import type { CardData } from "@/lib/profile";
import { ProfileCard } from "../ProfileCard";
import { ItemPreview } from "../ItemPreview";
import { Sticker, StyledName, themeStyle } from "../ui";
import { toast } from "../Toaster";

const TYPES: { id: ItemType; label: string; icon: string }[] = [
  { id: "sticker", label: "Sticker", icon: "🏷️" },
  { id: "frame", label: "Avatar decoration", icon: "💫" },
  { id: "avatar", label: "Avatar", icon: "🙂" },
  { id: "banner", label: "Banner", icon: "🖼️" },
  { id: "effect", label: "Profile effect", icon: "✨" },
  { id: "namestyle", label: "Name style", icon: "🔤" },
  { id: "theme", label: "App theme", icon: "🎨" },
  { id: "title", label: "Title", icon: "🎖️" },
];
const UPLOADS = new Set<ItemType>(["sticker", "frame", "avatar", "banner", "effect"]);
const SLOT: Partial<Record<ItemType, keyof CardData>> = { avatar: "avatar_item", frame: "frame_item", banner: "banner_item", effect: "effect_item", namestyle: "namestyle_item", title: "title_item" };
const STATUS_STYLE: Record<string, string> = { draft: "bg-raised text-muted", submitted: "bg-saffron/20 text-saffron", approved: "bg-sky-500/20 text-sky-300", live: "bg-jade/20 text-jade", retired: "bg-chili/15 text-red-300" };
const DEFAULT_THEME: Record<string, string> = { ink: "#0e1014", surface: "#171a21", raised: "#1f232c", line: "#2a2f3a", text: "#ece8e1", muted: "#9aa1ad", saffron: "#f5a524", jade: "#19b38a", lotus: "#ec6fa5" };
const PREVIEW_ID = "__preview__";

export type EditorInitial = {
  id: string; type: ItemType; name: string; description: string; rarity: Rarity; price: number | null; event: string | null;
  event_price: number | null; asset_key: string | null; artist: string; notes: string; data: CustomData; status: string;
  assetChecks: CheckResult | null;
};

function Checks({ result, title }: { result: CheckResult; title: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-muted">{title}</div>
      <ul className="space-y-1 text-sm">
        {result.checks.map((c) => (
          <li key={c.label} className="flex gap-2">
            <span>{c.pass ? "✅" : c.level === "warning" ? "⚠️" : "❌"}</span>
            <span className="font-semibold">{c.label}</span>
            <span className="text-muted">{c.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ItemEditor({ initial, events, card, mode = "staff", context }: {
  initial: EditorInitial | null; events: { id: string; name: string; icon: string }[]; card: CardData;
  /** "contributor" = partner or artist: no pricing, rarity or publishing. */
  mode?: "staff" | "contributor";
  context?: string;
}) {
  const router = useRouter();
  const contributor = mode === "contributor";
  const readOnly = contributor && initial?.status !== "draft";
  const [changeNote, setChangeNote] = useState("");
  const [type, setType] = useState<ItemType>(initial?.type ?? "sticker");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [rarity, setRarity] = useState<Rarity>(initial?.rarity ?? "rare");
  const [price, setPrice] = useState<string>(initial?.price ? String(initial.price) : "");
  const [event, setEvent] = useState(initial?.event ?? "");
  const [eventPrice, setEventPrice] = useState<string>(initial?.event_price !== null && initial?.event_price !== undefined ? String(initial.event_price) : "0");
  const [assetKey, setAssetKey] = useState<string | null>(initial?.asset_key ?? null);
  const [checks, setChecks] = useState<CheckResult | null>(initial?.assetChecks ?? null);
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [data, setData] = useState<CustomData>(initial?.data ?? {});
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const theme = { ...DEFAULT_THEME, ...(data.theme ?? {}) };
  const gradient = data.gradient?.length ? data.gradient : ["#f5a524", "#ec6fa5"];
  const colourResult = type === "theme" ? validateTheme(theme) : type === "namestyle" ? validateGradient(gradient) : null;
  const effData: CustomData = type === "theme" ? { ...data, theme } : type === "namestyle" ? { ...data, gradient } : data;

  const item: ShopItem = useMemo(
    () => ({
      ...toShopItem({
        id: PREVIEW_ID, type, name: name || "Untitled", description, rarity, price: price ? Number(price) : null,
        event: event || null, status: "live", asset_key: assetKey, data: JSON.stringify(effData), artist,
      }),
      id: PREVIEW_ID,
    }),
    [type, name, description, rarity, price, event, assetKey, effData, artist],
  );
  registerItems([item]); // let the shared components look the preview up by id

  const ready = readiness(
    { type, name, description, price: price ? Number(price) : null, event: event || null, event_price: Number(eventPrice), asset_key: assetKey, assetOk: !!checks?.ok, data: effData },
    colourResult?.ok ?? true,
  );
  const shownReady = contributor ? ready.filter((r) => !r.label.startsWith("Sold for")) : ready;
  const allReady = shownReady.every((r) => r.pass);
  const preview: CardData = { ...card, ...(SLOT[type] ? { [SLOT[type]!]: PREVIEW_ID } : {}) };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("file", file);
      const res = await fetch("/api/admin/assets", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setChecks(json.result);
      if (json.ok) {
        setAssetKey(json.key);
        toast({ icon: "✅", title: "Upload passed the checks" });
      } else toast({ icon: "❌", title: "Upload didn't pass the checks", body: "See the list for what to fix." });
    } catch (e) {
      toast({ icon: "⚠️", title: (e as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const save = () =>
    start(async () => {
      if (contributor) {
        const r = await contributorSaveItem({ id: initial!.id, name, description, asset_key: UPLOADS.has(type) ? assetKey : null, data: effData });
        if (r.error) return toast({ icon: "⚠️", title: r.error });
        toast({ icon: "💾", title: "Saved" });
        return router.refresh();
      }
      const input: SaveInput = {
        id: initial?.id, type, name, description, rarity, price: price ? Number(price) : null, event: event || null,
        event_price: event ? Number(eventPrice) : null, asset_key: UPLOADS.has(type) ? assetKey : null, artist, notes, data: effData,
      };
      const r = await saveCustomItem(input);
      if (r.error) return toast({ icon: "⚠️", title: r.error });
      toast({ icon: "💾", title: initial?.status === "live" ? "Saved: back to draft for review" : "Draft saved" });
      if (!initial) router.replace(`/admin/items/${r.id}`);
      else router.refresh();
    });

  const contribute = (what: "submit" | "withdraw") =>
    start(async () => {
      if (what === "submit") {
        const saved = await contributorSaveItem({ id: initial!.id, name, description, asset_key: UPLOADS.has(type) ? assetKey : null, data: effData });
        if (saved.error) return toast({ icon: "⚠️", title: saved.error });
      }
      const r = what === "submit" ? await submitItem(initial!.id) : await withdrawItem(initial!.id);
      if (r.error) return toast({ icon: "⚠️", title: r.error });
      toast({ icon: what === "submit" ? "📤" : "↩", title: what === "submit" ? "Submitted for review" : "Withdrawn: you can edit again" });
      router.refresh();
    });

  const status = (s: "draft" | "approved" | "live" | "retired") =>
    start(async () => {
      const r = await setItemStatus(initial!.id, s, changeNote);
      if (r.error) return toast({ icon: "⚠️", title: r.error });
      toast({ icon: s === "live" ? "🚀" : "✓", title: s === "live" ? "Live in the Kedai!" : `Marked ${s}` });
      router.refresh();
    });

  const spec = UPLOADS.has(type) ? SPECS[type as UploadType] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="min-w-0 space-y-5">
        {initial && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${STATUS_STYLE[initial.status]}`}>{initial.status}</span>
            <span className="text-xs text-muted">ID {initial.id}</span>
            {context && <span className="text-xs text-muted">· {context}</span>}
          </div>
        )}
        {readOnly && (
          <p className="rounded-xl border border-saffron/40 bg-saffron/10 p-3 text-sm">
            {initial?.status === "submitted" ? "Submitted: the KisahKisah team is reviewing it. Withdraw it if you need to change something." : `This item is ${initial?.status}. Comment below if something needs changing.`}
          </p>
        )}

        <fieldset disabled={readOnly || pending} className="space-y-5">
        <section className="glass space-y-4 p-5">
          {!contributor && <div>
            <span className="label">Type</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={!!initial && initial.status !== "draft"}
                  onClick={() => { setType(t.id); setAssetKey(null); setChecks(null); }}
                  className={`rounded-xl border p-2 text-sm font-semibold transition ${type === t.id ? "border-saffron bg-saffron/10" : "border-line hover:border-muted"}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ie-name">Name</label>
              <input id="ie-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <div>
              <label className="label" htmlFor="ie-artist">Artist credit</label>
              <input id="ie-artist" className="input" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="e.g. Nadia Rahman / Studio partner" maxLength={80} readOnly={contributor} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="ie-desc">Shop description</label>
            <input id="ie-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} />
          </div>
          {!contributor && <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="ie-rarity">Rarity</label>
              <select id="ie-rarity" className="input" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
                {Object.entries(RARITY_STYLE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ie-event">Where it's sold</label>
              <select id="ie-event" className="input" value={event} onChange={(e) => setEvent(e.target.value)}>
                <option value="">Kedai (always available)</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.icon} {ev.name} (limited)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="ie-price">{event ? "Event price (0 = free claim)" : "Price in KP"}</label>
              {event ? (
                <input id="ie-price" className="input" type="number" min={0} value={eventPrice} onChange={(e) => setEventPrice(e.target.value)} />
              ) : (
                <input id="ie-price" className="input" type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 300" />
              )}
            </div>
          </div>}
        </section>

        {spec && (
          <section className="glass space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display font-bold">Artwork · {spec.label}</h3>
              <Link href="/specs" target="_blank" className="text-xs text-saffron">Full spec & templates ↗</Link>
            </div>
            <p className="text-sm text-muted">
              {spec.recommended} · {spec.formats.join(", ").toUpperCase()} · max {Math.round(spec.maxBytes / 1000)} KB · {spec.alpha === "required" ? "transparent background" : "any background"}
              {spec.animated !== "no" ? " · animation OK" : ""}
            </p>
            <ul className="list-disc pl-5 text-xs text-muted">
              {spec.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line p-6 text-center text-sm text-muted hover:border-saffron"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) void upload(f);
              }}
            >
              {assetKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(assetKey)} alt="Uploaded artwork" className="max-h-40 rounded-lg" style={{ background: "repeating-conic-gradient(#2a2f3a 0 25%, #1f232c 0 50%) 0 0 / 16px 16px" }} />
              ) : (
                <span className="text-3xl">⬆️</span>
              )}
              <span>{uploading ? "Checking…" : assetKey ? "Drop or click to replace" : "Drop a file here or click to upload"}</span>
              <input ref={fileRef} type="file" accept="image/png,image/webp,image/gif,image/jpeg" className="hidden" aria-label="Upload artwork" onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            </div>
            {checks && <Checks result={checks} title="Automatic checks" />}
          </section>
        )}

        {type === "sticker" && (
          <section className="glass p-5">
            <label className="label" htmlFor="ie-anim">Animation (applied on top of the artwork)</label>
            <select id="ie-anim" className="input" value={data.anim ?? ""} onChange={(e) => setData({ ...data, anim: (e.target.value || undefined) as CustomData["anim"] })}>
              <option value="">None (or the file is already animated)</option>
              {["bounce", "wobble", "spin", "pulse", "float", "shake"].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </section>
        )}

        {type === "effect" && !assetKey && (
          <section className="glass grid gap-3 p-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ie-particles">Or use particles (up to 4 emoji)</label>
              <input id="ie-particles" className="input text-xl" value={(data.particles ?? []).join(" ")} onChange={(e) => setData({ ...data, particles: e.target.value.split(/\s+/).filter(Boolean).slice(0, 4) })} placeholder="🌸 ✨" />
            </div>
            <div>
              <label className="label" htmlFor="ie-motion">Motion</label>
              <select id="ie-motion" className="input" value={data.motion ?? "fall"} onChange={(e) => setData({ ...data, motion: e.target.value as CustomData["motion"] })}>
                {["fall", "rise", "drift", "streak", "twinkle"].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </section>
        )}

        {type === "theme" && (
          <section className="glass space-y-3 p-5">
            <h3 className="font-display font-bold">Theme colours</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {THEME_TOKENS.map((k) => (
                <label key={k} className="flex items-center gap-2 rounded-lg bg-black/20 p-2 text-sm">
                  <input type="color" value={theme[k]} onChange={(e) => setData({ ...data, theme: { ...theme, [k]: e.target.value } })} className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent" aria-label={THEME_TOKEN_LABELS[k]} />
                  {THEME_TOKEN_LABELS[k]}
                </label>
              ))}
            </div>
            {colourResult && <Checks result={colourResult} title="Contrast checks" />}
          </section>
        )}

        {type === "namestyle" && (
          <section className="glass space-y-3 p-5">
            <h3 className="font-display font-bold">Gradient</h3>
            <div className="flex flex-wrap items-center gap-2">
              {gradient.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <input type="color" value={c} onChange={(e) => setData({ ...data, gradient: gradient.map((x, j) => (j === i ? e.target.value : x)) })} className="h-9 w-12 cursor-pointer rounded border border-line bg-transparent" aria-label={`Colour ${i + 1}`} />
                  {gradient.length > 2 && <button type="button" className="text-muted hover:text-chili" onClick={() => setData({ ...data, gradient: gradient.filter((_, j) => j !== i) })} aria-label="Remove colour">✕</button>}
                </span>
              ))}
              {gradient.length < 4 && <button type="button" className="chip" onClick={() => setData({ ...data, gradient: [...gradient, "#ffffff"] })}>＋ colour</button>}
              <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={!!data.shimmer} onChange={(e) => setData({ ...data, gradient, shimmer: e.target.checked })} /> Shimmer</label>
            </div>
            {colourResult && <Checks result={colourResult} title="Readability checks" />}
          </section>
        )}

        {type === "title" && (
          <section className="glass p-5">
            <label className="label" htmlFor="ie-title">Title text</label>
            <input id="ie-title" className="input" value={data.text ?? ""} onChange={(e) => setData({ ...data, text: e.target.value })} maxLength={40} placeholder="e.g. Midnight Screener" />
          </section>
        )}

        {!contributor && (
          <section className="glass space-y-2 p-5">
            <label className="label" htmlFor="ie-notes">Internal notes (staff only)</label>
            <textarea id="ie-notes" className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Licence confirmed, artist invoice #…" />
          </section>
        )}
        </fieldset>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="text-xs font-bold uppercase tracking-widest text-muted">Live preview</div>
        <div data-theme={undefined} style={type === "theme" ? themeStyle(PREVIEW_ID) : undefined} className="space-y-3 rounded-2xl bg-ink p-2">
          <ProfileCard p={preview} variant="mini" />
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <div className="flex h-24 w-28 shrink-0 items-center justify-center">
              <ItemPreview item={item} avatar={card.avatar_item} displayName={card.display_name} compact />
            </div>
            <div className="min-w-0 text-sm">
              <div className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: RARITY_STYLE[rarity].color }}>{RARITY_STYLE[rarity].label}</div>
              <div className="font-bold">{name || "Untitled"}</div>
              <div className="line-clamp-2 text-xs text-muted">{description || "Shop description"}</div>
              {artist && <div className="text-[0.7rem] text-lotus">🎨 Art by {artist}</div>}
              <div className="mt-1 text-xs font-bold text-saffron">{event ? (Number(eventPrice) ? `🪙 ${eventPrice} during the event` : "Free claim during the event") : price ? `🪙 ${price}` : "No price yet"}</div>
            </div>
          </div>
          {type === "sticker" && (
            <div className="flex items-center gap-2 rounded-xl bg-surface p-3 text-sm">
              <span className="text-muted">On a review:</span>
              <span className="flex items-center gap-1.5 rounded-2xl border border-saffron bg-saffron/15 px-2 py-1"><Sticker id={PREVIEW_ID} size={26} /> <b>3</b></span>
            </div>
          )}
          {type === "namestyle" && (
            <div className="rounded-xl bg-surface p-3 text-sm">
              In comments: <StyledName name={card.display_name} style={PREVIEW_ID} className="font-semibold" />
            </div>
          )}
        </div>

        <div className="glass p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted">Ready to publish?</div>
          <ul className="space-y-1 text-sm">
            {shownReady.map((r) => (
              <li key={r.label}>{r.pass ? "✅" : "⬜"} {r.label}</li>
            ))}
          </ul>
        </div>

        {contributor ? (
          <div className="flex flex-wrap gap-2">
            {initial?.status === "draft" && <button className="btn btn-ghost" onClick={save} disabled={pending}>💾 Save</button>}
            {initial?.status === "draft" && <button className="btn btn-primary" onClick={() => contribute("submit")} disabled={pending || !allReady}>📤 Submit for review</button>}
            {initial?.status === "submitted" && <button className="btn btn-ghost" onClick={() => contribute("withdraw")} disabled={pending}>↩ Withdraw to edit</button>}
          </div>
        ) : (
        <>
        {(initial?.status === "submitted" || initial?.status === "approved") && (
          <input className="input" placeholder="What needs changing? (sent to the contributor)" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} aria-label="Change request note" />
        )}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={save} disabled={pending}>💾 {initial ? "Save changes" : "Save draft"}</button>
          {initial?.status === "submitted" && <button className="btn btn-ghost" onClick={() => status("approved")} disabled={pending || !allReady}>✓ Approve</button>}
          {initial?.status === "submitted" && <button className="btn btn-ghost" onClick={() => status("draft")} disabled={pending}>✏️ Request changes</button>}
          {initial?.status === "draft" && <button className="btn btn-ghost" onClick={() => status("approved")} disabled={pending || !allReady}>✓ Approve</button>}
          {(initial?.status === "approved" || initial?.status === "retired") && <button className="btn btn-primary" onClick={() => status("live")} disabled={pending}>🚀 Publish</button>}
          {initial?.status === "approved" && <button className="btn btn-ghost" onClick={() => status("draft")} disabled={pending}>↩ Request changes</button>}
          {initial?.status === "live" && <button className="btn btn-ghost" onClick={() => status("retired")} disabled={pending}>🔐 Retire (vault)</button>}
        </div>
        </>
        )}
        {initial?.status === "live" && <p className="text-xs text-muted">Saving changes to a live item sends it back to draft for review.</p>}
      </aside>
    </div>
  );
}
