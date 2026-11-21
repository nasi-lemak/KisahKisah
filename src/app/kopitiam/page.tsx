import type { Metadata } from "next";
import { Kopitiam } from "./Kopitiam";

export const metadata: Metadata = { title: "Kopitiam", robots: { index: false } };

export default function KopitiamPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">est. 1965 · you weren&apos;t supposed to find this</div>
        <h1 className="mt-2 font-display text-4xl font-bold">Kopitiam Kisah ☕</h1>
        <p className="mt-1 text-muted">Where film lovers argue over kopi until the shutters come down.</p>
      </div>
      <Kopitiam />
    </div>
  );
}
