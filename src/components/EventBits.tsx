"use client";

import { useTransition } from "react";
import { buyBundle, claimEventItem } from "@/app/actions";
import { useT } from "./I18n";
import { toast } from "./Toaster";
import { rain } from "./EasterEggs";

export function ClaimButton({ eventId, itemId, price, owned, affordable, live, signedIn, lockedLabel }: {
  eventId: string; itemId: string; price: number; owned: boolean; affordable: boolean; live: boolean; signedIn: boolean; lockedLabel?: string;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  if (owned) return <span className="block rounded-md bg-jade/15 py-1.5 text-center text-sm font-semibold text-jade">{t("drop.claimed")}</span>;
  if (!live) return <span className="block rounded-md bg-raised py-1.5 text-center text-xs text-muted">{lockedLabel ?? t("drop.notLive")}</span>;
  if (!signedIn) return <a href={`/login?next=/events/${eventId}`} className="btn btn-ghost w-full justify-center py-1.5 text-sm">{t("drop.signInClaim")}</a>;
  return (
    <button
      className="btn btn-primary w-full justify-center py-1.5 text-sm"
      disabled={pending || (price > 0 && !affordable)}
      onClick={() =>
        start(async () => {
          const r = await claimEventItem(eventId, itemId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
          if (r?.ok) {
            toast({ icon: "🎁", title: r.ok, body: t("drop.equipHint"), kind: "achievement" });
            rain(["🎁", "✨", "🎉"], 25);
          }
        })
      }
    >
      {pending ? "…" : price === 0 ? t("drop.claimFree") : `🪙 ${price.toLocaleString()}`}
    </button>
  );
}

export function BundleButton({ bundleId, price, owned, affordable, signedIn }: { bundleId: string; price: number; owned: boolean; affordable: boolean; signedIn: boolean }) {
  const t = useT();
  const [pending, start] = useTransition();
  if (owned) return <span className="block rounded-lg bg-jade/20 py-2 text-center text-sm font-bold text-jade">{t("drop.ownBundle")}</span>;
  if (!signedIn) return <a href="/login?next=/kedai" className="btn btn-ghost w-full justify-center">{t("drop.signInBuy")}</a>;
  return (
    <button
      className="btn btn-primary w-full justify-center"
      disabled={pending || !affordable}
      onClick={() =>
        start(async () => {
          const r = await buyBundle(bundleId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
          if (r?.ok) {
            toast({ icon: "🎁", title: r.ok, body: t("drop.bundleHint"), kind: "achievement" });
            rain(["🎁", "✨", "💎"], 35);
          }
        })
      }
    >
      {pending ? "…" : `🪙 ${price.toLocaleString()} · ${t("drop.getBundle")}`}
    </button>
  );
}
