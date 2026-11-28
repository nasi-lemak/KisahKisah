import Link from "next/link";
import { peekToken } from "@/lib/security";
import { ResetForm } from "@/components/AccountForms";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = !!peekToken(token, "reset");
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <h1 className="text-center font-display text-3xl font-bold">{t("account.reset.title")}</h1>
      <div className="card p-6">
        {valid ? (
          <ResetForm token={token} />
        ) : (
          <div className="space-y-3 text-center">
            <p>{t("account.linkExpired")}</p>
            <Link href="/forgot" className="btn btn-primary">{t("account.reset.newLink")}</Link>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted">{t("account.reset.note")}</p>
    </div>
  );
}
