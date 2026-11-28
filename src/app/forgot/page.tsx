import Link from "next/link";
import { ForgotForm } from "@/components/AccountForms";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Reset your password" };

export default async function ForgotPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">{t("account.forgot.title")}</h1>
        <p className="text-muted">{t("account.forgot.sub")}</p>
      </div>
      <div className="card p-6"><ForgotForm /></div>
      <p className="text-center text-sm text-muted"><Link href="/login" className="text-saffron">{t("account.forgot.back")}</Link></p>
    </div>
  );
}
