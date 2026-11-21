import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { rewindYears } from "@/lib/rewind";

export const metadata = { title: "Kisah Rewind" };

/** Send members to their own Rewind for this year (or their latest year with logs). */
export default async function RewindIndex() {
  const user = await requireUser("/rewind");
  const year = new Date().getFullYear();
  const years = rewindYears(user.id);
  redirect(`/rewind/${user.username}/${years.includes(year) || !years.length ? year : years[0]}`);
}
