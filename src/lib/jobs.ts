import "server-only";
import { all, run } from "./db";
import { runReminders } from "./reminders";
import { pruneUniques } from "./analytics";

/** Everything that should happen on a schedule. Idempotent: running twice in a row is harmless. */
export async function runJobs(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const record = (job: string, result: string) => {
    out[job] = result;
    run(
      "INSERT INTO job_runs (job, last_run_at, last_result) VALUES (?, datetime('now'), ?) ON CONFLICT(job) DO UPDATE SET last_run_at = excluded.last_run_at, last_result = excluded.last_result",
      job, result,
    );
  };
  try {
    const r = await runReminders();
    record("reminders", `${r.sent} sent, ${r.emailed} emailed${r.stale ? `, ${r.stale} expired` : ""}`);
  } catch (e) {
    record("reminders", `error: ${(e as Error).message}`);
  }
  pruneUniques();
  const now = new Date().toISOString();
  const sessions = run("DELETE FROM sessions WHERE expires_at < ?", now).changes;
  const tokens = run("DELETE FROM auth_tokens WHERE expires_at < ?", now).changes;
  const attempts = run("DELETE FROM auth_attempts WHERE at < ?", new Date(Date.now() - 86400_000).toISOString()).changes;
  record("cleanup", `${sessions} expired sessions, ${tokens} expired links, ${attempts} old attempts removed`);
  return out;
}

export function lastJobRuns() {
  return all<{ job: string; last_run_at: string; last_result: string }>("SELECT * FROM job_runs ORDER BY job");
}
