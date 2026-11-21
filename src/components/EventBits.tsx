"use client";

import { useTransition } from "react";
import { buyBundle, claimEventItem } from "@/app/actions";
import { toast } from "./Toaster";
import { rain } from "./EasterEggs";

export function ClaimButton({ eventId, itemId, price, owned, affordable, live, signedIn }: {
  eventId: string; itemId: string; price: number; owned: boolean; affordable: boolean; live: boolean; signedIn: boolean;
}) {
  const [pending, start] = useTransition();
  if (owned) return <span className="block rounded-md bg-jade/15 py-1.5 text-center text-sm font-semibold text-jade">✓ Claimed</span>;
  if (!live) return <span className="block rounded-md bg-raised py-1.5 text-center text-xs text-muted">🔒 Not live yet</span>;
  if (!signedIn) return <a href={`/login?next=/events/${eventId}`} className="btn btn-ghost w-full justify-center py-1.5 text-sm">Sign in to claim</a>;
  return (
    <button
      className="btn btn-primary w-full justify-center py-1.5 text-sm"
      disabled={pending || (price > 0 && !affordable)}
      onClick={() =>
        start(async () => {
          const r = await claimEventItem(eventId, itemId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
          if (r?.ok) {
            toast({ icon: "🎁", title: r.ok, body: "Equip it from your inventory.", kind: "achievement" });
            rain(["🎁", "✨", "🎉"], 25);
          }
        })
      }
    >
      {pending ? "…" : price === 0 ? "🎁 Claim free" : `🪙 ${price.toLocaleString()}`}
    </button>
  );
}

export function BundleButton({ bundleId, price, owned, affordable, signedIn }: { bundleId: string; price: number; owned: boolean; affordable: boolean; signedIn: boolean }) {
  const [pending, start] = useTransition();
  if (owned) return <span className="block rounded-lg bg-jade/20 py-2 text-center text-sm font-bold text-jade">✓ You own this bundle</span>;
  if (!signedIn) return <a href="/login?next=/kedai" className="btn btn-ghost w-full justify-center">Sign in to buy</a>;
  return (
    <button
      className="btn btn-primary w-full justify-center"
      disabled={pending || !affordable}
      onClick={() =>
        start(async () => {
          const r = await buyBundle(bundleId);
          if (r?.error) toast({ icon: "⚠️", title: r.error });
          if (r?.ok) {
            toast({ icon: "🎁", title: r.ok, body: "Try it all on in Profile Studio.", kind: "achievement" });
            rain(["🎁", "✨", "💎"], 35);
          }
        })
      }
    >
      {pending ? "…" : `🪙 ${price.toLocaleString()} · Get bundle`}
    </button>
  );
}
