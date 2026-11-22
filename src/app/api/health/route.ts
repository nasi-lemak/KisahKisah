import { one } from "@/lib/db";
import { storageHealthy } from "@/lib/storage";

/** For load balancers and uptime checks. 200 when the database and storage answer. */
export async function GET() {
  let database = false;
  try {
    database = one<{ ok: number }>("SELECT 1 ok")?.ok === 1;
  } catch {}
  const storage = await storageHealthy();
  const ok = database && storage;
  return Response.json({ ok, database, storage, time: new Date().toISOString() }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
