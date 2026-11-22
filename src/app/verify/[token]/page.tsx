import Link from "next/link";
import { peekToken } from "@/lib/security";
import { maskEmail } from "@/lib/security-core";
import { ConfirmEmailButton } from "@/components/AccountForms";

export const metadata = { title: "Confirm your email", referrer: "no-referrer" };

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = peekToken(token, "verify");
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6 text-center">
      <div className="text-5xl">📧</div>
      <h1 className="font-display text-3xl font-bold">Confirm your email</h1>
      <div className="card space-y-3 p-6">
        {t ? (
          <>
            <p className="text-sm text-muted">Confirm <b className="text-text">{maskEmail(t.email)}</b> for your KisahKisah account.</p>
            <ConfirmEmailButton token={token} />
          </>
        ) : (
          <>
            <p>This link has expired or was already used.</p>
            <Link href="/settings" className="btn btn-primary">Send a new one from Settings</Link>
          </>
        )}
      </div>
    </div>
  );
}
