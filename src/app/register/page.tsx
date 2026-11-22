import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { COUNTRIES } from "@/lib/regions";
import { RegisterForm } from "@/components/forms";

export const metadata = { title: "Join" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const t = await getT();
  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">{t("register.heading")}</h1>
        <p className="text-muted">{t("register.sub", { kp: 100 })}</p>
      </div>
      <div className="card p-6">
        <RegisterForm countries={COUNTRIES} next={next} />
      </div>
      <p className="text-center text-sm text-muted">
        {t("register.member")} <Link href="/login" className="font-semibold text-saffron">{t("auth.signin")}</Link>
      </p>
    </div>
  );
}
