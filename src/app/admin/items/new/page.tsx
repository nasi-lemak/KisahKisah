import { requireStaff } from "@/lib/auth";
import { cardData } from "@/lib/profile";
import { allEvents } from "@/lib/events";
import { ItemEditor } from "@/components/admin/ItemEditor";

export default async function NewItem() {
  const user = await requireStaff();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">New item</h1>
      <ItemEditor initial={null} card={cardData(user)} events={allEvents().map((e) => ({ id: e.id, name: e.name, icon: e.icon }))} />
    </div>
  );
}
