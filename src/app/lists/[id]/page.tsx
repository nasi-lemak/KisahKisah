import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth";
import { listById, listItems } from "@/lib/queries";
import { Poster, Empty } from "@/components/ui";
import { deleteList, removeFromList } from "@/app/actions";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const l = listById(Number((await params).id));
  return { title: l?.title ?? "Catalogue" };
}

export default async function ListPage({ params }: { params: Params }) {
  const id = Number((await params).id);
  const list = Number.isInteger(id) ? listById(id) : undefined;
  if (!list) notFound();
  const user = await currentUser();
  const items = listItems(list.id);
  const mine = user?.id === list.user_id;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-muted">
          Catalogue by <Link href={`/u/${list.username}`} className="font-semibold text-text hover:text-saffron">{list.display_name}</Link>
          {list.ranked ? " · ranked" : ""} · {items.length} films
        </div>
        <h1 className="mt-1 font-display text-4xl font-bold">{list.title}</h1>
        {list.description && <p className="mt-2 max-w-2xl text-muted">{list.description}</p>}
      </div>
      {items.length === 0 ? (
        <Empty>This catalogue is empty. Add films from any film page.</Empty>
      ) : (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {items.map((f, i) => (
            <div key={f.id} className="relative">
              {list.ranked ? (
                <div className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-saffron font-bold text-ink shadow-lg">{i + 1}</div>
              ) : null}
              <Poster film={f} />
              {mine && (
                <form action={removeFromList.bind(null, list.id, f.id)} className="mt-1 text-center">
                  <button className="text-xs text-muted hover:text-chili">remove</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
      {mine && (
        <form action={deleteList.bind(null, list.id)}>
          <button className="text-sm text-muted hover:text-chili">Delete this catalogue</button>
        </form>
      )}
    </div>
  );
}
