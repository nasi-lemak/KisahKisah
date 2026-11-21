import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/regions";
import { SettingsForm } from "@/components/forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/settings");
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <div className="card p-6">
        <SettingsForm user={user} countries={COUNTRIES} />
      </div>
      <p className="text-sm text-muted">
        Avatar, decoration, effects, name style, banner, colours and showcases live in <Link href="/studio" className="text-saffron">Profile Studio</Link>.
      </p>
    </div>
  );
}
