import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/regions";
import { SettingsForm } from "@/components/forms";
import { EmailSettings, PasswordSettings } from "@/components/AccountForms";
import { signOutEverywhere } from "@/app/account-actions";
import { LanguagePicker } from "@/components/LanguagePicker";
import { getLocale, getT } from "@/lib/i18n/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const user = await requireUser("/settings");
  const { reset } = await searchParams;
  const locale = await getLocale();
  const t = await getT();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      {reset && <p className="rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-sm text-emerald-300">Password reset. You're signed in here and signed out everywhere else.</p>}
      <div className="card p-6">
        <SettingsForm user={user} countries={COUNTRIES} />
      </div>
      <section className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <h2 className="font-display text-xl font-bold">{t("lang.label")}</h2>
        <LanguagePicker id="settings-lang" current={locale} label={t("lang.label")} />
      </section>
      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Account &amp; security</h2>
        <EmailSettings email={user.email} verified={!!user.email_verified_at} />
        <hr className="border-line" />
        <PasswordSettings />
        <hr className="border-line" />
        <form action={signOutEverywhere} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Lost a phone or used a shared computer?</p>
          <button className="btn btn-ghost">Sign out everywhere</button>
        </form>
      </section>
      <p className="text-sm text-muted">
        Avatar, decoration, effects, name style, banner, colours and showcases live in <Link href="/studio" className="text-saffron">Profile Studio</Link>.
      </p>
    </div>
  );
}
