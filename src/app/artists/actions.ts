"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { one, run } from "@/lib/db";
import { artistProfile, briefById, briefItems, isApprovedArtist, notifyStaff } from "@/lib/portal";

type State = { error?: string; ok?: string } | undefined;

export async function applyAsArtist(_: State, form: FormData): Promise<State> {
  const user = await requireUser("/artists/apply");
  const url = String(form.get("portfolio_url") ?? "").trim();
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error();
  } catch {
    return { error: "Add a link to your portfolio (https://…)." };
  }
  const existing = artistProfile(user.id);
  if (existing?.status === "approved") return { error: "You're already in the programme." };
  run(
    `INSERT INTO artist_profiles (user_id, portfolio_url, bio, specialities, payout_details) VALUES (?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET portfolio_url = excluded.portfolio_url, bio = excluded.bio, specialities = excluded.specialities,
       payout_details = excluded.payout_details, status = 'applied', created_at = datetime('now')`,
    user.id, url.slice(0, 300), String(form.get("bio") ?? "").slice(0, 1000), form.getAll("specialities").map(String).join(",").slice(0, 200),
    String(form.get("payout_details") ?? "").slice(0, 300),
  );
  notifyStaff("🎨", `New artist application: ${user.display_name}`, url);
  redirect("/artists");
}

const MAX_ACTIVE = 3;

export async function claimBrief(id: number) {
  const user = await requireUser("/artists/briefs");
  if (!isApprovedArtist(user.id)) return;
  const active = one<{ n: number }>("SELECT COUNT(*) n FROM briefs WHERE assigned_to = ? AND status IN ('assigned', 'in_review')", user.id)?.n ?? 0;
  if (active >= MAX_ACTIVE) redirect("/artists?limit=1");
  const r = run("UPDATE briefs SET status = 'assigned', assigned_to = ?, claimed_at = datetime('now') WHERE id = ? AND status = 'open'", user.id, id);
  if (r.changes) notifyStaff("✋", `${user.display_name} claimed a brief`, briefById(id)?.title ?? "");
  redirect(`/artists/briefs/${id}`);
}

/** Create the next piece for a brief and open it in the editor. */
export async function startBriefItem(briefId: number) {
  const user = await requireUser();
  const b = briefById(briefId);
  if (!b || b.assigned_to !== user.id || b.status === "done" || b.status === "cancelled") return;
  const n = briefItems(briefId).length;
  if (n >= b.quantity) redirect(`/artists/briefs/${briefId}`);
  const id = `ci_${randomBytes(5).toString("hex")}`;
  run(
    `INSERT INTO custom_items (id, type, name, description, rarity, event, event_price, source, brief_id, artist, submitted_by, created_by)
     VALUES (?,?,?,?, 'rare', ?, ?, 'artist', ?,?,?,?)`,
    id, b.item_type, `${b.title} #${n + 1}`, "", b.event, b.event ? 0 : null, briefId, user.display_name, user.id, user.id,
  );
  revalidatePath(`/artists/briefs/${briefId}`);
  redirect(`/contribute/items/${id}`);
}
