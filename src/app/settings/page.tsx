import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { COUNTRIES } from "@/lib/regions";
import { SettingsForm } from "@/components/forms";
import { DeleteAccountForm, EmailSettings, PasswordSettings } from "@/components/AccountForms";
import { signOutEverywhere } from "@/app/account-actions";
import { LanguagePicker } from "@/components/LanguagePicker";
import { TwoFactorSettings } from "@/components/TwoFactor";
import { recoveryCodesLeft, requireStaff2fa } from "@/lib/twofactor";
import { getLocale, getT } from "@/lib/i18n/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ reset?: string; need2fa?: string }> }) {
  const user = await requireUser("/settings");
  const { reset, need2fa } = await searchParams;
  const staff = user.role === "staff" || user.role === "admin";
  const locale = await getLocale();
  const t = await getT();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("settings.title")}</h1>
      {reset && <p className="rounded-md border border-jade/40 bg-jade/10 px-3 py-2 text-sm text-emerald-300">{t("settings.resetDone")}</p>}
      <div className="card p-6">
        <SettingsForm user={user} countries={COUNTRIES} />
      </div>
      <section className="card flex flex-wrap items-center justify-between gap-3 p-6">
        <h2 className="font-display text-xl font-bold">{t("lang.label")}</h2>
        <LanguagePicker id="settings-lang" current={locale} label={t("lang.label")} />
      </section>
      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">{t("settings.security")}</h2>
        <EmailSettings email={user.email} verified={!!user.email_verified_at} />
        <hr className="border-line" />
        <PasswordSettings />
        <hr className="border-line" />
        <div id="two-step" className="scroll-mt-24 space-y-2">
          <h3 className="font-bold">🔐 Two-step sign-in</h3>
          {need2fa && <p className="rounded-md border border-saffron/40 bg-saffron/10 px-3 py-2 text-sm">Turn on two-step sign-in to use the admin.</p>}
          <TwoFactorSettings enabled={!!user.totp_enabled_at} codesLeft={user.totp_enabled_at ? recoveryCodesLeft(user.id) : 0} required={staff && requireStaff2fa()} />
        </div>
        <hr className="border-line" />
        <form action={signOutEverywhere} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{t("settings.lost")}</p>
          <button className="btn btn-ghost">{t("settings.signOutAll")}</button>
        </form>
      </section>
      <section className="card space-y-4 p-6">
        <h2 className="font-display text-xl font-bold">Your data</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted">A copy of everything you&apos;ve put into KisahKisah, as a JSON file.</p>
          <a href="/api/me/export" className="btn btn-ghost" download>⬇ Download my data</a>
        </div>
        <details className="rounded-xl border border-chili/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-red-300">Delete my account</summary>
          <div className="mt-3"><DeleteAccountForm username={user.username} twoFactor={!!user.totp_enabled_at} /></div>
        </details>
      </section>
      <p className="text-sm text-muted">
        {t("settings.studioNote")} <Link href="/studio" className="text-saffron">{t("settings.studio")}</Link>.
      </p>
    </div>
  );
}
