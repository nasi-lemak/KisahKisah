import Link from "next/link";
import { peekToken } from "@/lib/security";
import { maskEmail } from "@/lib/security-core";
import { ConfirmEmailButton } from "@/components/AccountForms";
import { Rich } from "@/components/Rich";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Confirm your email", referrer: "no-referrer" };

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = peekToken(token, "verify");
  const t = await getT();
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6 text-center">
      <div className="text-5xl">📧</div>
      <h1 className="font-display text-3xl font-bold">{t("account.verify.title")}</h1>
      <div className="card space-y-3 p-6">
        {info ? (
          <>
            <p className="text-sm text-muted"><Rich text={t("account.verify.body")} nodes={{ email: <b className="text-text">{maskEmail(info.email)}</b> }} /></p>
            <ConfirmEmailButton token={token} />
          </>
        ) : (
          <>
            <p>{t("account.linkExpired")}</p>
            <Link href="/settings" className="btn btn-primary">{t("account.verify.newOne")}</Link>
          </>
        )}
      </div>
    </div>
  );
}
