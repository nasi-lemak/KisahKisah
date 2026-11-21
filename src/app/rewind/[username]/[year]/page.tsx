import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { currentUser, userByUsername } from "@/lib/auth";
import { computeRewind, rewindYears } from "@/lib/rewind";
import { RewindStory } from "@/components/RewindStory";

type Params = Promise<{ username: string; year: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username, year } = await params;
  const u = userByUsername(username);
  return { title: u ? `${u.display_name}'s ${year} Rewind` : "Rewind" };
}

export default async function RewindPage({ params }: { params: Params }) {
  const { username, year: y } = await params;
  const year = Number(y);
  const u = userByUsername(username);
  if (!u || !Number.isInteger(year) || year < 1900 || year > 2100) notFound();
  const viewer = await currentUser();
  const data = computeRewind(u.id, year);
  const years = rewindYears(u.id);
  const h = await headers();
  const shareUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/rewind/${u.username}/${year}`;
  const isOwner = viewer?.id === u.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {years.map((yr) => (
          <Link key={yr} href={`/rewind/${u.username}/${yr}`} className={`chip ${yr === year ? "border-saffron text-saffron" : ""}`}>{yr}</Link>
        ))}
      </div>
      {data.logs === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center">
          <div className="text-5xl">🎞️</div>
          <h1 className="mt-3 font-display text-2xl font-bold">No kisah in {year} yet</h1>
          <p className="mt-2 text-muted">{isOwner ? "Log some films or series and your Rewind will fill itself in." : `${u.display_name} hasn't logged anything in ${year}.`}</p>
          {isOwner && <Link href="/films" className="btn btn-primary mt-5">Log something</Link>}
        </div>
      ) : (
        <RewindStory d={data} who={u} isOwner={isOwner} shareUrl={shareUrl} />
      )}
    </div>
  );
}
