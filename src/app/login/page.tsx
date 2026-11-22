import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "@/components/forms";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/" } = await searchParams;
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">{t("login.heading")}</h1>
        <p className="text-muted">{t("login.sub")}</p>
      </div>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
      <p className="text-center text-sm text-muted">
        <Link href="/forgot" className="text-saffron">{t("login.forgot")}</Link>
      </p>
      <p className="text-center text-sm text-muted">
        {t("login.new")} <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-saffron">{t("login.create")}</Link>
      </p>
      <p className="text-center text-xs text-muted">{t("login.demo", { users: "aisyah, budi, nong, migs, linh, weijie, jiwoo", password: "kisah123" })}</p>
    </div>
  );
}
