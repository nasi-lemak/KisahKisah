import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { FRANCHISES } from "@/lib/franchises";
import { FranchiseRow, watchedSlugs } from "@/components/FranchisePanel";

export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const user = await currentUser();
  const all = FRANCHISES.flatMap((f) => f.entries.map((e) => e.slug));
  const seen = watchedSlugs(user?.id, all);
  const done = FRANCHISES.filter((f) => f.entries.every((e) => seen.has(e.slug))).length;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Collections</h1>
          <p className="max-w-2xl text-muted">
            Trilogies, sagas, shared universes and spin-offs, with the order to watch them in. Finish one for the <b>Trilogy Complete</b> achievement.
          </p>
        </div>
        {user && (
          <div className="glass px-5 py-3 text-center">
            <div className="font-display text-3xl font-extrabold">{done}<span className="text-lg text-muted">/{FRANCHISES.length}</span></div>
            <div className="text-xs uppercase tracking-widest text-muted">completed</div>
          </div>
        )}
      </div>
      <div className="space-y-6">
        {FRANCHISES.map((f) => (
          <section key={f.id} id={f.id} className="card scroll-mt-24 p-5">
            <FranchiseRow f={f} viewerId={user?.id} />
          </section>
        ))}
      </div>
    </div>
  );
}
