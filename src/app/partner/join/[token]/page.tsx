import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one } from "@/lib/db";
import { joinOrg } from "@/app/partner/actions";

export const metadata = { title: "Join partner team", robots: { index: false } };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser(`/partner/join/${token}`);
  const inv = one<{ name: string; used_by: number | null }>("SELECT o.name, i.used_by FROM org_invites i JOIN orgs o ON o.id = i.org_id WHERE i.token = ?", token);
  if (!inv) notFound();
  return (
    <div className="mx-auto max-w-md space-y-4 pt-8 text-center">
      <div className="text-5xl">🤝</div>
      <h1 className="font-display text-3xl font-extrabold">Join {inv.name}</h1>
      <p className="text-muted">You'll be able to fill in campaign briefs, upload artwork and follow the review as <b className="text-text">{user.display_name}</b> (@{user.username}).</p>
      {inv.used_by && inv.used_by !== user.id ? (
        <p className="rounded-xl bg-chili/10 p-3 text-sm text-red-300">This invite has already been used. Ask for a new link.</p>
      ) : (
        <form action={joinOrg.bind(null, token)}>
          <button className="btn btn-primary">Join the team</button>
        </form>
      )}
    </div>
  );
}
