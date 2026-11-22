import Link from "next/link";
import { peekToken } from "@/lib/security";
import { ResetForm } from "@/components/AccountForms";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = !!peekToken(token, "reset");
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <h1 className="text-center font-display text-3xl font-bold">Choose a new password</h1>
      <div className="card p-6">
        {valid ? (
          <ResetForm token={token} />
        ) : (
          <div className="space-y-3 text-center">
            <p>This link has expired or was already used.</p>
            <Link href="/forgot" className="btn btn-primary">Send a new link</Link>
          </div>
        )}
      </div>
      <p className="text-center text-xs text-muted">Setting a new password signs you out on every other device.</p>
    </div>
  );
}
