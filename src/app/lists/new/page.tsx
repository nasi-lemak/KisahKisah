import { requireUser } from "@/lib/auth";
import { listFilms } from "@/lib/queries";
import { country } from "@/lib/regions";
import { ListBuilder } from "@/components/forms";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "New catalogue" };

export default async function NewListPage({ searchParams }: { searchParams: Promise<{ film?: string }> }) {
  await requireUser("/lists/new");
  const { film } = await searchParams;
  const t = await getT();
  const films = listFilms({ sort: "title" }).map((f) => ({ id: f.id, title: f.title, year: f.year, country: f.country, flag: country(f.country)?.flag ?? "" }));
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("lists.newTitle")}</h1>
      <ListBuilder films={films} preselect={film ? Number(film) : undefined} />
    </div>
  );
}
