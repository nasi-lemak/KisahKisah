import { currentUser } from "@/lib/auth";
import { exportAccount } from "@/lib/account-data";

/** Download everything you've put into KisahKisah (Settings → Your data). */
export async function GET() {
  const user = await currentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });
  const data = exportAccount(user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="kisahkisah-${user.username}-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
