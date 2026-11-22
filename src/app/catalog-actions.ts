"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStaff, requireUser } from "@/lib/auth";
import { all, one, run } from "@/lib/db";
import { limited, noteAttempt } from "@/lib/security";
import { minutes } from "@/lib/security-core";
import { enrich, fetchTitle, tmdbConfigured, upsertTitle } from "@/lib/tmdb";
import type { Kind } from "@/lib/tmdb-core";
import type { FormState } from "./actions";

/** Any signed-in member can add a missing title from TMDB (throttled); staff without limits. */
export async function importFromTmdb(kind: Kind, id: number): Promise<FormState> {
  const user = await requireUser("/films");
  if (!tmdbConfigured()) return { error: "Title import isn't set up on this server." };
  if (kind !== "film" && kind !== "series") return { error: "Unknown kind." };
  const staff = user.role === "staff" || user.role === "admin";
  if (!staff) {
    const gate = limited(`import:u:${user.id}`, 20, 60);
    if (gate.blocked) return { error: `You've added a lot of titles. Try again in ${minutes(gate.retryAfterMs)}.` };
    noteAttempt(`import:u:${user.id}`);
  }
  let slug: string;
  try {
    slug = upsertTitle(await fetchTitle(kind, Number(id))).slug;
  } catch (e) {
    return { error: `Couldn't reach TMDB (${(e as Error).message}). Try again shortly.` };
  }
  revalidatePath("/films");
  redirect(`/film/${slug}`);
}

/** Staff: match hand-made catalogue titles to TMDB and fill posters, runtimes and cast. */
export async function enrichCatalogue(): Promise<FormState> {
  await requireStaff();
  if (!tmdbConfigured()) return { error: "Set TMDB_API_KEY first." };
  const todo = all<{ id: number; title: string; original_title: string | null; year: number; kind: string }>(
    `SELECT id, title, original_title, year, kind FROM films
     WHERE tmdb_id IS NULL AND (tmdb_checked_at IS NULL OR tmdb_checked_at < datetime('now', '-30 days')) ORDER BY id LIMIT 25`,
  );
  let matched = 0;
  let failed = 0;
  for (const f of todo) {
    try {
      if (await enrich(f)) matched++;
      run("UPDATE films SET tmdb_checked_at = datetime('now') WHERE id = ?", f.id);
    } catch {
      failed++; // network trouble: try this one again next run
    }
  }
  revalidatePath("/", "layout");
  const left = one<{ n: number }>("SELECT COUNT(*) n FROM films WHERE tmdb_id IS NULL AND tmdb_checked_at IS NULL")!.n;
  return { ok: `Checked ${todo.length} titles: ${matched} matched${failed ? `, ${failed} errors` : ""}. ${left ? `${left} still to check: run again.` : "All titles checked."}` };
}
