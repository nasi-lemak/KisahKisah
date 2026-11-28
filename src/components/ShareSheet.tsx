"use client";

import { useState } from "react";
import { toast } from "./Toaster";
import { useT } from "./I18n";

/** Spotify-style share: copy link, chat apps popular across SEA and beyond, native share, scannable code. */
export function ShareSheet({ url, title, text, qrSvg, label }: { url: string; title: string; text: string; qrSvg?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const enc = encodeURIComponent;
  const msg = `${text} ${url}`;
  const targets: [string, string, string, string][] = [
    ["WhatsApp", "#25D366", "💬", `https://wa.me/?text=${enc(msg)}`],
    ["Telegram", "#229ED9", "✈️", `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`],
    ["LINE", "#06C755", "🟩", `https://social-plugins.line.me/lineit/share?url=${enc(url)}`],
    ["X", "#000000", "𝕏", `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`],
    ["Threads", "#000000", "🧵", `https://www.threads.net/intent/post?text=${enc(msg)}`],
    ["Facebook", "#1877F2", "📘", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ icon: "🔗", title: t("lists.share.copied"), body: t("lists.share.copiedBody") });
    } catch {
      toast({ icon: "🔗", title: url });
    }
  };
  const native = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {}
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>↗ {label ?? t("lists.share.label")}</button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setOpen(false)} role="dialog" aria-modal="true" aria-label={t("lists.share.aria", { title })}>
          <div className="glass toast-in w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-muted">{t("lists.share.label")}</div>
                <div className="truncate font-display text-xl font-extrabold">{title}</div>
              </div>
              <button className="text-2xl leading-none text-muted hover:text-text" onClick={() => setOpen(false)} aria-label={t("lists.share.close")}>×</button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink p-2">
              <input readOnly value={url} className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-muted outline-none" onFocus={(e) => e.target.select()} aria-label={t("lists.share.link")} />
              <button className="btn btn-primary py-1.5 text-sm" onClick={copy}>{t("lists.share.copy")}</button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {targets.map(([name, color, icon, href]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 rounded-xl border border-line bg-raised/60 py-3 text-xs font-semibold hover:border-saffron">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white" style={{ background: color }}>{icon}</span>
                  {name}
                </a>
              ))}
            </div>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button className="btn btn-ghost mt-3 w-full justify-center" onClick={native}>{t("lists.share.more")}</button>
            )}

            {qrSvg && (
              <div className="mt-4 flex items-center gap-4 rounded-xl bg-black/25 p-3">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-white p-1.5" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <p className="text-xs text-muted">{t("lists.share.qr")}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
