import { GENRES } from "@/lib/catalog";
import { COUNTRIES } from "@/lib/regions";
import { HouseEventForm } from "@/components/admin/HouseEventForm";

export default function NewEvent() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-extrabold">New event</h1>
      <HouseEventForm initial={null} genres={[...GENRES]} countries={COUNTRIES.map((c) => ({ code: c.code, name: c.name, flag: c.flag }))} />
    </div>
  );
}
