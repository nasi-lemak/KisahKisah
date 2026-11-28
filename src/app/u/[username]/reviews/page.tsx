import { notFound } from "next/navigation";
import { currentUser, userByUsername } from "@/lib/auth";
import { reviewsByUser } from "@/lib/queries";
import { ReviewCard } from "@/components/ReviewCard";
import { Empty } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function UserReviews({ params }: { params: Promise<{ username: string }> }) {
  const u = userByUsername((await params).username);
  if (!u) notFound();
  const viewer = await currentUser();
  const reviews = reviewsByUser(u.id, viewer?.id ?? 0);
  const t = await getT();
  if (!reviews.length) return <Empty>{t("profile.noReviews")}</Empty>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} r={r} viewerId={viewer?.id} />
      ))}
    </div>
  );
}
