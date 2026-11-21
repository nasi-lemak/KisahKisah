import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { achievementProgress } from "@/lib/rewards";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { all } from "@/lib/db";
import { ITEM_BY_ID } from "@/lib/shop";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const user = await currentUser();
  const rows = user
    ? achievementProgress(user.id)
    : ACHIEVEMENTS.map((a) => ({ id: a.id, name: a.name, description: a.description, icon: a.icon, points: a.points, hidden: !!a.hidden, reward: a.reward ?? null, unlockedAt: null, current: 0, goal: 1 }));
  const total = all<{ id: string; n: number }>("SELECT achievement_id id, COUNT(*) n FROM user_achievements GROUP BY achievement_id");
  const users = all<{ n: number }>("SELECT COUNT(*) n FROM users")[0]?.n || 1;
  const pct = new Map(total.map((t) => [t.id, Math.round((t.n / users) * 100)]));
  const done = rows.filter((r) => r.unlockedAt).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Achievements</h1>
          <p className="text-muted">Watch widely, review boldly, explore the region, and poke around. Some are secret.</p>
        </div>
        {user ? (
          <div className="card px-5 py-3 text-center">
            <div className="font-display text-3xl font-bold">{done}<span className="text-lg text-muted">/{rows.length}</span></div>
            <div className="text-xs uppercase tracking-widest text-muted">unlocked</div>
          </div>
        ) : (
          <Link href="/login?next=/achievements" className="btn btn-primary">Sign in to track progress</Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((a) => {
          const unlocked = !!a.unlockedAt;
          const secret = a.hidden && !unlocked;
          const reward = a.reward ? ITEM_BY_ID[a.reward] : null;
          return (
            <div key={a.id} className={`card flex items-center gap-4 p-4 ${unlocked ? "border-saffron/50 bg-gradient-to-r from-[#2a1e08]/60 to-surface" : ""}`}>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${unlocked ? "bg-saffron/15" : "bg-raised grayscale"}`}>
                {secret ? "❔" : a.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-bold">{secret ? "Secret achievement" : a.name}</div>
                  <div className="shrink-0 text-xs font-semibold text-saffron">+{a.points} KP</div>
                </div>
                <div className="text-sm text-muted">{secret ? "Keep exploring. You'll know it when you find it." : a.description}</div>
                {!secret && reward && <div className="mt-0.5 text-xs text-lotus">Reward: {reward.name} ({reward.type})</div>}
                {user && !unlocked && !secret && a.goal > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-raised">
                      <div className="h-full bg-jade" style={{ width: `${(a.current / a.goal) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted">{a.current}/{a.goal}</span>
                  </div>
                )}
                <div className="mt-1 text-[0.7rem] text-muted">
                  {unlocked ? `Unlocked ${a.unlockedAt!.slice(0, 10)} · ` : ""}
                  {pct.get(a.id) ?? 0}% of members
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
