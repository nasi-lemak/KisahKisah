import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { inventory, reviewsByUser } from "@/lib/queries";
import { cardData, parseShowcases } from "@/lib/profile";
import { ITEMS } from "@/lib/shop";
import { StudioEditor } from "@/components/StudioEditor";

export const metadata: Metadata = { title: "Profile Studio" };

export default async function StudioPage() {
  const user = await requireUser("/studio");
  const base = { ...cardData(user), theme_item: user.theme_item, showcases: parseShowcases(user.showcases), pinned_review_id: user.pinned_review_id };
  const owned = inventory(user.id);
  const items = ITEMS.filter((i) => ["avatar", "frame", "effect", "namestyle", "banner", "title", "theme"].includes(i.type));
  const reviews = reviewsByUser(user.id).map((r) => ({ id: r.id, title: `${r.film_title} (${r.film_year})` }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Profile Studio 🎨</h1>
          <p className="text-muted">Mix decorations, effects, name styles, colours and showcases. Try anything on before you buy.</p>
        </div>
        <Link href="/kedai" className="btn btn-ghost">🏪 Visit the Kedai</Link>
      </div>
      <StudioEditor base={base} items={items} owned={owned} points={user.points} reviews={reviews} />
    </div>
  );
}
